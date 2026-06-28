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

  // Line items
  const lineItems = await db
    .select({
      label:     cylinderTypes.label,
      quantity:  orderLineItems.quantity,
      unitPrice: orderLineItems.unitPrice,
    })
    .from(orderLineItems)
    .innerJoin(cylinderTypes, eq(orderLineItems.cylinderTypeId, cylinderTypes.id))
    .where(eq(orderLineItems.orderId, orderId));

  // Payment
  const [payment] = await db
    .select({
      status:       payments.status,
      paymentRef:   payments.paymentRef,
      confirmedAt:  payments.adminConfirmedAt,
    })
    .from(payments)
    .where(eq(payments.orderId, orderId));

  // Delivery assignment
  const [delivery] = await db
    .select({
      status:       deliveryAssignments.status,
      assignedAt:   deliveryAssignments.assignedAt,
      dispatchedAt: deliveryAssignments.dispatchedAt,
      deliveredAt:  deliveryAssignments.deliveredAt,
    })
    .from(deliveryAssignments)
    .where(eq(deliveryAssignments.orderId, orderId));

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
