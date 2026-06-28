"use server";

import { revalidatePath } from "next/cache";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, sql } from "drizzle-orm";
import pgClient from "@/lib/db/client";
import {
  deliveryAssignments,
  deliveryPersons,
  orders,
  customers,
  inventory,
  orderLineItems,
} from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/db/queries/auth";
import { sendPushToUser, sendPushToAllAdmins } from "@/lib/notifications/send-push";

const db = drizzle(pgClient);

type ActionResult = { ok: true } | { ok: false; error: string };

// ─── Admin: assign a delivery person ─────────────────────────────────────────

export async function assignDeliveryAction(
  orderId: string,
  deliveryPersonId: string
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return { ok: false, error: "Unauthorized" };

  if (!deliveryPersonId) {
    return { ok: false, error: "Select a delivery person" };
  }

  try {
    await db.insert(deliveryAssignments).values({
      orderId,
      deliveryPersonId,
      status: "assigned",
    });

    await db
      .update(orders)
      .set({ status: "assigned", updatedAt: sql`now()` })
      .where(eq(orders.id, orderId));

    revalidatePath("/admin/deliveries");
    revalidatePath("/admin/orders");

    // Notify the customer — fire-and-forget
    try {
      const [orderRow] = await db
        .select({ authUserId: customers.authUserId })
        .from(orders)
        .innerJoin(customers, eq(orders.customerId, customers.id))
        .where(eq(orders.id, orderId));
      if (orderRow?.authUserId) {
        await sendPushToUser(orderRow.authUserId, {
          title: "Order Assigned 📦",
          body: "Your order has been assigned to a delivery person.",
          url: `/orders/${orderId}`,
        });
      }
    } catch { /* push is best-effort */ }

    return { ok: true };
  } catch (e) {
    console.error("[assignDeliveryAction]", e);
    return { ok: false, error: "Failed to assign delivery. Please try again." };
  }
}

// ─── Delivery person: mark out for delivery ───────────────────────────────────

export async function markOutForDeliveryAction(
  assignmentId: string
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  try {
    const [assignment] = await db
      .select({ orderId: deliveryAssignments.orderId, deliveryPersonId: deliveryAssignments.deliveryPersonId })
      .from(deliveryAssignments)
      .where(eq(deliveryAssignments.id, assignmentId));

    if (!assignment) return { ok: false, error: "Assignment not found" };

    // Verify caller is the assigned delivery person (or admin)
    if (user.role !== "admin") {
      const [dp] = await db
        .select({ authUserId: deliveryPersons.authUserId })
        .from(deliveryPersons)
        .where(eq(deliveryPersons.id, assignment.deliveryPersonId));

      if (!dp || dp.authUserId !== user.id) {
        return { ok: false, error: "Unauthorized — this delivery is not assigned to you" };
      }
    }

    await db
      .update(deliveryAssignments)
      .set({ status: "out_for_delivery", dispatchedAt: sql`now()` })
      .where(eq(deliveryAssignments.id, assignmentId));

    await db
      .update(orders)
      .set({ status: "out_for_delivery", updatedAt: sql`now()` })
      .where(eq(orders.id, assignment.orderId));

    revalidatePath(`/delivery/deliveries/${assignmentId}`);
    revalidatePath("/admin/deliveries");

    // Notify the customer — fire-and-forget
    try {
      const [orderRow] = await db
        .select({ authUserId: customers.authUserId })
        .from(orders)
        .innerJoin(customers, eq(orders.customerId, customers.id))
        .where(eq(orders.id, assignment.orderId));
      if (orderRow?.authUserId) {
        await sendPushToUser(orderRow.authUserId, {
          title: "Out for Delivery 🚚",
          body: "Your cylinders are on the way!",
          url: `/orders/${assignment.orderId}`,
        });
      }
    } catch { /* push is best-effort */ }

    return { ok: true };
  } catch (e) {
    console.error("[markOutForDeliveryAction]", e);
    return { ok: false, error: "Failed to update status. Please try again." };
  }
}

// ─── Delivery person: mark delivered ─────────────────────────────────────────

export async function markDeliveredAction(
  assignmentId: string,
  remarks: string
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  try {
    const [assignment] = await db
      .select({ orderId: deliveryAssignments.orderId, deliveryPersonId: deliveryAssignments.deliveryPersonId })
      .from(deliveryAssignments)
      .where(eq(deliveryAssignments.id, assignmentId));

    if (!assignment) return { ok: false, error: "Assignment not found" };

    // Verify caller
    if (user.role !== "admin") {
      const [dp] = await db
        .select({ authUserId: deliveryPersons.authUserId })
        .from(deliveryPersons)
        .where(eq(deliveryPersons.id, assignment.deliveryPersonId));

      if (!dp || dp.authUserId !== user.id) {
        return { ok: false, error: "Unauthorized — this delivery is not assigned to you" };
      }
    }

    await db
      .update(deliveryAssignments)
      .set({
        status:      "delivered",
        deliveredAt: sql`now()`,
        remarks:     remarks.trim() || null,
      })
      .where(eq(deliveryAssignments.id, assignmentId));

    await db
      .update(orders)
      .set({ status: "delivered", updatedAt: sql`now()` })
      .where(eq(orders.id, assignment.orderId));

    // Stock lifecycle: reserved_stock → delivered_stock
    const lines = await db
      .select({
        cylinderTypeId: orderLineItems.cylinderTypeId,
        quantity:       orderLineItems.quantity,
      })
      .from(orderLineItems)
      .where(eq(orderLineItems.orderId, assignment.orderId));

    for (const line of lines) {
      await db
        .update(inventory)
        .set({
          reservedStock:  sql`reserved_stock  - ${line.quantity}`,
          deliveredStock: sql`delivered_stock + ${line.quantity}`,
        })
        .where(eq(inventory.cylinderTypeId, line.cylinderTypeId));
    }

    revalidatePath(`/delivery/deliveries/${assignmentId}`);
    revalidatePath("/admin/deliveries");
    revalidatePath("/admin/inventory");

    // Notify customer + admins — fire-and-forget
    try {
      const [orderRow] = await db
        .select({ authUserId: customers.authUserId })
        .from(orders)
        .innerJoin(customers, eq(orders.customerId, customers.id))
        .where(eq(orders.id, assignment.orderId));
      if (orderRow?.authUserId) {
        await sendPushToUser(orderRow.authUserId, {
          title: "Delivered ✅",
          body: "Your cylinders have been delivered. Thank you!",
          url: `/orders/${assignment.orderId}`,
        });
      }
      await sendPushToAllAdmins({
        title: "Order Delivered 📦",
        body: "A delivery has been completed.",
        url: "/admin/deliveries",
      });
    } catch { /* push is best-effort */ }

    return { ok: true };
  } catch (e) {
    console.error("[markDeliveredAction]", e);
    return { ok: false, error: "Failed to mark as delivered. Please try again." };
  }
}
