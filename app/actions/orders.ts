"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, sql } from "drizzle-orm";
import pgClient from "@/lib/db/client";
import { orders, orderLineItems, payments, inventory, cylinderTypes } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/db/queries/auth";
import { getCustomerForUser } from "@/lib/db/queries/customers";
import { getActiveCylinderCount } from "@/lib/db/queries/customer-orders";
import { buildUpiLink } from "@/lib/utils/upi";
import { sendPushToAllAdmins } from "@/lib/notifications/send-push";

const db = drizzle(pgClient);

const UPI_VPA      = process.env.NEXT_PUBLIC_UPI_VPA      ?? "agency@upi";
const UPI_MERCHANT = process.env.NEXT_PUBLIC_UPI_MERCHANT_NAME ?? "LPGHub";

export type OrderLineInput = {
  cylinderTypeId: string;
  inventoryId: string;
  quantity: number;
};

export type CreateOrderResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string };

export async function createOrderAction(
  lines: OrderLineInput[]
): Promise<CreateOrderResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  // Resolve customer from auth user (phone fallback)
  const customer = await getCustomerForUser(user.id, user.phone);
  if (!customer) return { ok: false, error: "Customer account not found" };
  if (!customer.isActive) return { ok: false, error: "Your account is not yet active â€” contact the agency" };

  // Validate line inputs
  const selectedLines = lines.filter((l) => l.quantity > 0);
  if (selectedLines.length === 0) return { ok: false, error: "Select at least one cylinder" };

  const totalQty = selectedLines.reduce((sum, l) => sum + l.quantity, 0);

  // Count cylinders already committed in active orders â€” enforce limit across all orders
  const activeCylinders = await getActiveCylinderCount(customer.id);
  if (totalQty + activeCylinders > customer.eligibilityLimit) {
    const remaining = customer.eligibilityLimit - activeCylinders;
    return {
      ok: false,
      error: remaining <= 0
        ? `You have reached your eligibility limit of ${customer.eligibilityLimit} cylinders across active orders`
        : `You can only order ${remaining} more cylinder${remaining !== 1 ? "s" : ""} (${activeCylinders} already in active orders)`,
    };
  }

  try {
    // Fetch current prices and stock â€” source of truth is DB, not client
    const stockRows = await db
      .select({
        cylinderTypeId: inventory.cylinderTypeId,
        inventoryId:    inventory.id,
        availableStock: inventory.availableStock,
        unitPrice:      cylinderTypes.unitPrice,
      })
      .from(inventory)
      .innerJoin(cylinderTypes, eq(inventory.cylinderTypeId, cylinderTypes.id));

    const stockMap = new Map(stockRows.map((r) => [r.cylinderTypeId, r]));

    // Validate stock availability
    for (const line of selectedLines) {
      const stock = stockMap.get(line.cylinderTypeId);
      if (!stock) return { ok: false, error: "Invalid cylinder type" };
      if (line.quantity > stock.availableStock) {
        return {
          ok: false,
          error: `Only ${stock.availableStock} cylinders available for that type`,
        };
      }
    }

    // Calculate total
    let totalAmount = 0;
    for (const line of selectedLines) {
      const stock = stockMap.get(line.cylinderTypeId)!;
      totalAmount += line.quantity * Number(stock.unitPrice);
    }

    // Insert order
    const [order] = await db
      .insert(orders)
      .values({
        customerId:  customer.id,
        status:      "pending_payment",
        totalAmount: totalAmount.toFixed(2),
      })
      .returning();

    // Insert line items
    for (const line of selectedLines) {
      const stock = stockMap.get(line.cylinderTypeId)!;
      await db.insert(orderLineItems).values({
        orderId:        order.id,
        cylinderTypeId: line.cylinderTypeId,
        quantity:       line.quantity,
        unitPrice:      stock.unitPrice,
      });
    }

    // Create payment record with UPI link
    const upiLink = buildUpiLink({
      vpa: UPI_VPA,
      merchantName: UPI_MERCHANT,
      amount: totalAmount.toFixed(2),
      orderId: order.id,
    });
    await db.insert(payments).values({
      orderId: order.id,
      amount:  totalAmount.toFixed(2),
      upiLink,
      status:  "pending",
    });

    // Decrement available_stock, increment reserved_stock (stock lifecycle rule)
    for (const line of selectedLines) {
      const stock = stockMap.get(line.cylinderTypeId)!;
      await db
        .update(inventory)
        .set({
          availableStock: sql`available_stock - ${line.quantity}`,
          reservedStock:  sql`reserved_stock  + ${line.quantity}`,
        })
        .where(eq(inventory.id, stock.inventoryId));
    }

    revalidatePath("/orders");
    revalidatePath("/admin/inventory");
    revalidateTag("admin-stats", "max");
    revalidateTag("admin-urgent", "max");
    revalidateTag("inventory", "max");

    // Notify admins â€” fire-and-forget, never fails the action
    try {
      await sendPushToAllAdmins({
        title: "New Order ðŸ›’",
        body: `${customer.businessName} placed a new cylinder order.`,
        url: "/admin/orders",
      });
    } catch { /* push is best-effort */ }

    return { ok: true, orderId: order.id };
  } catch (e) {
    console.error("[createOrderAction]", e);
    return { ok: false, error: "Failed to place order. Please try again." };
  }
}

// â”€â”€â”€ Customer: cancel a pending_payment order â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type ActionResult = { ok: true } | { ok: false; error: string };

export async function cancelOrderAction(orderId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const customer = await getCustomerForUser(user.id, user.phone);
  if (!customer) return { ok: false, error: "Customer account not found" };

  try {
    // Verify order belongs to this customer and is still cancellable
    const [order] = await db
      .select({ id: orders.id, status: orders.status, customerId: orders.customerId })
      .from(orders)
      .where(eq(orders.id, orderId));

    if (!order || order.customerId !== customer.id) {
      return { ok: false, error: "Order not found" };
    }
    if (order.status !== "pending_payment") {
      return {
        ok: false,
        error: "This order can no longer be cancelled â€” contact your agency admin",
      };
    }

    // Restore inventory: reserved_stock â†’ available_stock
    const lines = await db
      .select({ cylinderTypeId: orderLineItems.cylinderTypeId, quantity: orderLineItems.quantity })
      .from(orderLineItems)
      .where(eq(orderLineItems.orderId, orderId));

    for (const line of lines) {
      await db
        .update(inventory)
        .set({
          availableStock: sql`available_stock + ${line.quantity}`,
          reservedStock:  sql`reserved_stock  - ${line.quantity}`,
        })
        .where(eq(inventory.cylinderTypeId, line.cylinderTypeId));
    }

    // Mark order and payment cancelled
    await db
      .update(orders)
      .set({ status: "cancelled", updatedAt: sql`now()` })
      .where(eq(orders.id, orderId));

    await db
      .update(payments)
      .set({ status: "rejected" })
      .where(eq(payments.orderId, orderId));

    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/admin/inventory");
    revalidatePath("/admin/orders");
    revalidateTag("admin-stats", "max");
    revalidateTag("admin-urgent", "max");
    revalidateTag("inventory", "max");
    return { ok: true };
  } catch (e) {
    console.error("[cancelOrderAction]", e);
    return { ok: false, error: "Failed to cancel order. Please try again." };
  }
}
