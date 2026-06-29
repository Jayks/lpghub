import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import pgClient from "@/lib/db/client";
import {
  orders,
  orderLineItems,
  cylinderTypes,
  payments,
  deliveryAssignments,
} from "@/lib/db/schema";

const db = drizzle(pgClient);

// ─── Active cylinder count ────────────────────────────────────────────────────

/**
 * Returns the total number of cylinders the customer has committed to in
 * open (non-terminal) orders. Used to enforce the eligibility limit across
 * all active orders, not just the current one being placed.
 *
 * Terminal statuses excluded: delivered, cancelled, rejected, draft
 */
const ACTIVE_STATUSES = [
  "pending_payment",
  "payment_pending_confirmation",
  "confirmed",
  "assigned",
  "out_for_delivery",
] as const;

export async function getActiveCylinderCount(customerId: string): Promise<number> {
  const [result] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${orderLineItems.quantity}), 0)`,
    })
    .from(orders)
    .innerJoin(orderLineItems, eq(orderLineItems.orderId, orders.id))
    .where(
      and(
        eq(orders.customerId, customerId),
        inArray(orders.status, [...ACTIVE_STATUSES])
      )
    );

  return Number(result?.total ?? 0);
}

// ─── Orders list ──────────────────────────────────────────────────────────────

export type CustomerOrderRow = {
  id: string;
  orderNumber: number;
  status: string;
  totalAmount: string;
  createdAt: Date | null;
  // Aggregated from line items — e.g. "2× 15 kg, 1× 17 kg"
  linesSummary: string;
};

export async function getCustomerOrders(
  customerId: string
): Promise<CustomerOrderRow[]> {
  const rows = await db
    .select({
      id:          orders.id,
      orderNumber: orders.orderNumber,
      status:      orders.status,
      totalAmount: orders.totalAmount,
      createdAt:   orders.createdAt,
      label:       cylinderTypes.label,
      quantity:    orderLineItems.quantity,
    })
    .from(orders)
    .leftJoin(orderLineItems, eq(orderLineItems.orderId, orders.id))
    .leftJoin(cylinderTypes,  eq(orderLineItems.cylinderTypeId, cylinderTypes.id))
    .where(eq(orders.customerId, customerId))
    .orderBy(desc(orders.createdAt));

  // Group by order, aggregate line items into a summary string
  const map = new Map<string, CustomerOrderRow>();
  for (const row of rows) {
    if (!map.has(row.id)) {
      map.set(row.id, {
        id:          row.id,
        orderNumber: row.orderNumber,
        status:      row.status,
        totalAmount: row.totalAmount ?? "0",
        createdAt:   row.createdAt,
        linesSummary: "",
      });
    }
    if (row.label && row.quantity) {
      const entry = map.get(row.id)!;
      const part = `${row.quantity}× ${row.label}`;
      entry.linesSummary = entry.linesSummary
        ? `${entry.linesSummary}, ${part}`
        : part;
    }
  }

  return [...map.values()];
}

// ─── Order detail ─────────────────────────────────────────────────────────────

export type CustomerOrderDetail = {
  id: string;
  orderNumber: number;
  status: string;
  totalAmount: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  lineItems: Array<{ label: string; quantity: number; unitPrice: string }>;
  payment: {
    status: string;
    paymentRef: string | null;
    confirmedAt: Date | null;
  } | null;
  delivery: {
    status: string;
    assignedAt: Date | null;
    dispatchedAt: Date | null;
    deliveredAt: Date | null;
  } | null;
};

export async function getCustomerOrderDetail(
  orderId: string,
  customerId: string
): Promise<CustomerOrderDetail | null> {
  // Verify this order belongs to the customer
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId));

  if (!order || order.customerId !== customerId) return null;

  // All three sub-queries only need `orderId` (a parameter) — run in parallel.
  const [lineItems, paymentRows, deliveryRows] = await Promise.all([
    // Line items
    db
      .select({
        label:     cylinderTypes.label,
        quantity:  orderLineItems.quantity,
        unitPrice: orderLineItems.unitPrice,
      })
      .from(orderLineItems)
      .innerJoin(cylinderTypes, eq(orderLineItems.cylinderTypeId, cylinderTypes.id))
      .where(eq(orderLineItems.orderId, orderId)),

    // Payment
    db
      .select({
        status:      payments.status,
        paymentRef:  payments.paymentRef,
        confirmedAt: payments.adminConfirmedAt,
      })
      .from(payments)
      .where(eq(payments.orderId, orderId)),

    // Delivery assignment
    db
      .select({
        status:       deliveryAssignments.status,
        assignedAt:   deliveryAssignments.assignedAt,
        dispatchedAt: deliveryAssignments.dispatchedAt,
        deliveredAt:  deliveryAssignments.deliveredAt,
      })
      .from(deliveryAssignments)
      .where(eq(deliveryAssignments.orderId, orderId)),
  ]);

  const payment  = paymentRows[0];
  const delivery = deliveryRows[0];

  return {
    id:          order.id,
    orderNumber: order.orderNumber,
    status:      order.status,
    totalAmount: order.totalAmount ?? "0",
    createdAt:   order.createdAt,
    updatedAt:   order.updatedAt,
    lineItems,
    payment:  payment  ?? null,
    delivery: delivery ?? null,
  };
}

// ─── Recent orders for home page ──────────────────────────────────────────────
// Two-step: first fetch the N most recent order IDs (simple LIMIT), then fetch
// their line items with a single IN query. Avoids pulling every order row when
// the home page only needs 3 recent items.

export async function getRecentCustomerOrders(
  customerId: string,
  limit: number
): Promise<CustomerOrderRow[]> {
  // Step 1: latest N orders — no join needed, small result
  const recentOrders = await db
    .select({
      id:          orders.id,
      orderNumber: orders.orderNumber,
      status:      orders.status,
      totalAmount: orders.totalAmount,
      createdAt:   orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.customerId, customerId))
    .orderBy(desc(orders.createdAt))
    .limit(limit);

  if (recentOrders.length === 0) return [];

  // Step 2: line items for those orders — single IN query
  const orderIds = recentOrders.map((o) => o.id);
  const lineRows = await db
    .select({
      orderId:  orderLineItems.orderId,
      label:    cylinderTypes.label,
      quantity: orderLineItems.quantity,
    })
    .from(orderLineItems)
    .innerJoin(cylinderTypes, eq(orderLineItems.cylinderTypeId, cylinderTypes.id))
    .where(inArray(orderLineItems.orderId, orderIds));

  // Build lines summary per order
  const linesByOrder = new Map<string, string[]>();
  for (const row of lineRows) {
    if (!linesByOrder.has(row.orderId)) linesByOrder.set(row.orderId, []);
    linesByOrder.get(row.orderId)!.push(`${row.quantity}× ${row.label}`);
  }

  return recentOrders.map((o) => ({
    id:          o.id,
    orderNumber: o.orderNumber,
    status:      o.status,
    totalAmount: o.totalAmount ?? "0",
    createdAt:   o.createdAt,
    linesSummary: linesByOrder.get(o.id)?.join(", ") ?? "",
  }));
}
