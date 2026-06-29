"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, sql } from "drizzle-orm";
import pgClient from "@/lib/db/client";
import { payments, orders, inventory, orderLineItems, customers } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/db/queries/auth";
import { sendPushToUser, sendPushToAllAdmins } from "@/lib/notifications/send-push";

const db = drizzle(pgClient);

type ActionResult = { ok: true } | { ok: false; error: string };

// â”€â”€â”€ Admin: confirm a payment â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function confirmPaymentAction(
  paymentId: string,
  orderId: string,
  paymentRef?: string | null
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return { ok: false, error: "Unauthorized" };

  const trimmedRef = paymentRef?.trim() || null;

  try {
    await db
      .update(payments)
      .set({
        status:             "confirmed",
        adminConfirmedBy:   user.id,
        adminConfirmedAt:   sql`now()`,
        // Only overwrite paymentRef if admin provided one
        ...(trimmedRef ? { paymentRef: trimmedRef } : {}),
      })
      .where(eq(payments.id, paymentId));

    await db
      .update(orders)
      .set({ status: "confirmed", updatedAt: sql`now()` })
      .where(eq(orders.id, orderId));

    revalidatePath("/admin/payments");
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    revalidateTag("admin-stats", "max");
    revalidateTag("admin-urgent", "max");

    // Notify the customer â€” fire-and-forget
    try {
      const [orderRow] = await db
        .select({ authUserId: customers.authUserId })
        .from(orders)
        .innerJoin(customers, eq(orders.customerId, customers.id))
        .where(eq(orders.id, orderId));
      if (orderRow?.authUserId) {
        await sendPushToUser(orderRow.authUserId, {
          title: "Payment Confirmed âœ…",
          body: "Your payment has been verified. Your order is being prepared.",
          url: `/orders/${orderId}`,
        });
      }
    } catch { /* push is best-effort */ }

    return { ok: true };
  } catch (e) {
    console.error("[confirmPaymentAction]", e);
    return { ok: false, error: "Failed to confirm payment. Please try again." };
  }
}

// â”€â”€â”€ Admin: reject a payment â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function rejectPaymentAction(
  paymentId: string,
  orderId: string
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return { ok: false, error: "Unauthorized" };

  try {
    await db
      .update(payments)
      .set({ status: "rejected" })
      .where(eq(payments.id, paymentId));

    await db
      .update(orders)
      .set({ status: "rejected", updatedAt: sql`now()` })
      .where(eq(orders.id, orderId));

    // Restore inventory â€” reserved_stock back to available_stock
    const lines = await db
      .select({
        cylinderTypeId: orderLineItems.cylinderTypeId,
        quantity:       orderLineItems.quantity,
      })
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

    revalidatePath("/admin/payments");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/inventory");
    revalidatePath("/admin");
    revalidateTag("admin-stats", "max");
    revalidateTag("admin-urgent", "max");
    revalidateTag("inventory", "max");

    // Notify the customer â€” fire-and-forget
    try {
      const [orderRow] = await db
        .select({ authUserId: customers.authUserId })
        .from(orders)
        .innerJoin(customers, eq(orders.customerId, customers.id))
        .where(eq(orders.id, orderId));
      if (orderRow?.authUserId) {
        await sendPushToUser(orderRow.authUserId, {
          title: "Payment Not Verified âŒ",
          body: "Your payment could not be verified. Please contact your agency.",
          url: `/orders/${orderId}`,
        });
      }
    } catch { /* push is best-effort */ }

    return { ok: true };
  } catch (e) {
    console.error("[rejectPaymentAction]", e);
    return { ok: false, error: "Failed to reject payment. Please try again." };
  }
}

// â”€â”€â”€ Customer: report payment made â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function reportPaymentAction(
  orderId: string,
  paymentRef: string | null
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const ref = paymentRef?.trim() || null;

  try {
    await db
      .update(payments)
      .set({ paymentRef: ref, payerReportedStatus: "paid" })
      .where(eq(payments.orderId, orderId));

    await db
      .update(orders)
      .set({ status: "payment_pending_confirmation", updatedAt: sql`now()` })
      .where(eq(orders.id, orderId));

    revalidatePath(`/orders`);
    revalidatePath(`/payments/${orderId}`);
    revalidateTag("admin-urgent", "max");

    // Notify admins â€” fire-and-forget
    try {
      await sendPushToAllAdmins({
        title: "Payment Reported ðŸ’°",
        body: "A customer has reported a UPI payment â€” please verify.",
        url: "/admin/payments",
      });
    } catch { /* push is best-effort */ }

    return { ok: true };
  } catch (e) {
    console.error("[reportPaymentAction]", e);
    return { ok: false, error: "Failed to report payment. Please try again." };
  }
}
