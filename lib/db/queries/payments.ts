import { desc, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import pgClient from "@/lib/db/client";
import { payments, orders, customers, orderLineItems, cylinderTypes } from "@/lib/db/schema";

const db = drizzle(pgClient);

// ─── Admin view — payments awaiting confirmation ──────────────────────────────

export type PendingPaymentRow = {
  paymentId: string;
  orderId: string;
  orderNumber: number;
  amount: string;
  paymentRef: string | null;
  businessName: string;
  phone: string;
  createdAt: Date | null;
};

export async function getPendingPayments(): Promise<PendingPaymentRow[]> {
  return db
    .select({
      paymentId:    payments.id,
      orderId:      payments.orderId,
      orderNumber:  orders.orderNumber,
      amount:       payments.amount,
      paymentRef:   payments.paymentRef,
      businessName: customers.businessName,
      phone:        customers.phone,
      createdAt:    payments.createdAt,
    })
    .from(payments)
    .innerJoin(orders,    eq(payments.orderId,    orders.id))
    .innerJoin(customers, eq(orders.customerId,   customers.id))
    .where(eq(orders.status, "payment_pending_confirmation"))
    .orderBy(desc(payments.createdAt));
}

// ─── Admin view — orders awaiting customer payment ───────────────────────────

export type AwaitingPaymentRow = {
  orderId: string;
  orderNumber: number;
  amount: string;
  businessName: string;
  phone: string;
  createdAt: Date | null;
};

export async function getAwaitingPaymentOrders(): Promise<AwaitingPaymentRow[]> {
  return db
    .select({
      orderId:      orders.id,
      orderNumber:  orders.orderNumber,
      amount:       orders.totalAmount,
      businessName: customers.businessName,
      phone:        customers.phone,
      createdAt:    orders.createdAt,
    })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(eq(orders.status, "pending_payment"))
    .orderBy(desc(orders.createdAt));
}

// ─── Admin view — payment history (confirmed + rejected) ─────────────────────

export type PaymentHistoryRow = {
  paymentId: string;
  orderId: string;
  orderNumber: number;
  amount: string;
  paymentRef: string | null;
  businessName: string;
  status: "confirmed" | "rejected";
  resolvedAt: Date | null;
};

export async function getPaymentHistory(limit = 60): Promise<PaymentHistoryRow[]> {
  const rows = await db
    .select({
      paymentId:    payments.id,
      orderId:      payments.orderId,
      orderNumber:  orders.orderNumber,
      amount:       payments.amount,
      paymentRef:   payments.paymentRef,
      businessName: customers.businessName,
      status:       payments.status,
      resolvedAt:   payments.adminConfirmedAt,
    })
    .from(payments)
    .innerJoin(orders,    eq(payments.orderId,  orders.id))
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(inArray(payments.status, ["confirmed", "rejected"]))
    .orderBy(desc(payments.adminConfirmedAt))
    .limit(limit);

  return rows as PaymentHistoryRow[];
}

// ─── Customer view — single order payment details ─────────────────────────────

export type OrderPaymentDetail = {
  orderId: string;
  orderStatus: string;
  totalAmount: string;
  businessName: string;
  address: string;
  paymentId: string | null;
  paymentStatus: string | null;
  upiLink: string | null;
  paymentRef: string | null;
  lineItems: Array<{ label: string; quantity: number; unitPrice: string }>;
};

export async function getOrderPaymentDetail(
  orderId: string
): Promise<OrderPaymentDetail | null> {
  // Load order + customer
  const [row] = await db
    .select({
      orderId:      orders.id,
      orderStatus:  orders.status,
      totalAmount:  orders.totalAmount,
      businessName: customers.businessName,
      address:      customers.address,
      paymentId:    payments.id,
      paymentStatus: payments.status,
      upiLink:      payments.upiLink,
      paymentRef:   payments.paymentRef,
    })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .leftJoin(payments, eq(payments.orderId, orders.id))
    .where(eq(orders.id, orderId));

  if (!row) return null;

  // Load line items
  const lines = await db
    .select({
      label:     cylinderTypes.label,
      quantity:  orderLineItems.quantity,
      unitPrice: orderLineItems.unitPrice,
    })
    .from(orderLineItems)
    .innerJoin(cylinderTypes, eq(orderLineItems.cylinderTypeId, cylinderTypes.id))
    .where(eq(orderLineItems.orderId, orderId));

  return {
    orderId:       row.orderId,
    orderStatus:   row.orderStatus,
    totalAmount:   row.totalAmount ?? "0",
    businessName:  row.businessName,
    address:       row.address,
    paymentId:     row.paymentId,
    paymentStatus: row.paymentStatus,
    upiLink:       row.upiLink,
    paymentRef:    row.paymentRef,
    lineItems:     lines.map((l) => ({
      label:     l.label,
      quantity:  l.quantity,
      unitPrice: l.unitPrice,
    })),
  };
}
