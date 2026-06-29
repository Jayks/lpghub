import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import pgClient from "@/lib/db/client";
import {
  orders,
  customers,
  orderLineItems,
  cylinderTypes,
  payments,
  deliveryAssignments,
  deliveryPersons,
} from "@/lib/db/schema";

const db = drizzle(pgClient);

export type AdminOrderDetail = {
  id: string;
  orderNumber: number;
  status: string;
  totalAmount: string;
  createdAt: Date | null;
  notes: string | null;
  customer: {
    id: string;
    businessName: string;
    contactPerson: string;
    phone: string;
    address: string;
  };
  lineItems: Array<{ label: string; quantity: number; unitPrice: string }>;
  payment: {
    id: string;
    status: string;
    paymentRef: string | null;
    confirmedAt: Date | null;
  } | null;
  delivery: {
    id: string;
    status: string;
    personName: string;
    personPhone: string;
    assignedAt: Date | null;
    dispatchedAt: Date | null;
    deliveredAt: Date | null;
    remarks: string | null;
  } | null;
};

export async function getAdminOrderDetail(
  orderId: string
): Promise<AdminOrderDetail | null> {
  const [row] = await db
    .select({
      id:           orders.id,
      orderNumber:  orders.orderNumber,
      status:       orders.status,
      totalAmount:  orders.totalAmount,
      createdAt:    orders.createdAt,
      notes:        orders.notes,
      customerId:   customers.id,
      businessName: customers.businessName,
      contactPerson: customers.contactPerson,
      phone:        customers.phone,
      address:      customers.address,
    })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(eq(orders.id, orderId));

  if (!row) return null;

  // All three sub-queries only need `orderId` (a parameter) — run in parallel.
  const [lineItems, paymentRows, assignRows] = await Promise.all([
    db
      .select({
        label:     cylinderTypes.label,
        quantity:  orderLineItems.quantity,
        unitPrice: orderLineItems.unitPrice,
      })
      .from(orderLineItems)
      .innerJoin(cylinderTypes, eq(orderLineItems.cylinderTypeId, cylinderTypes.id))
      .where(eq(orderLineItems.orderId, orderId)),

    db
      .select({
        id:          payments.id,
        status:      payments.status,
        paymentRef:  payments.paymentRef,
        confirmedAt: payments.adminConfirmedAt,
      })
      .from(payments)
      .where(eq(payments.orderId, orderId)),

    db
      .select({
        id:           deliveryAssignments.id,
        status:       deliveryAssignments.status,
        personName:   deliveryPersons.name,
        personPhone:  deliveryPersons.phone,
        assignedAt:   deliveryAssignments.assignedAt,
        dispatchedAt: deliveryAssignments.dispatchedAt,
        deliveredAt:  deliveryAssignments.deliveredAt,
        remarks:      deliveryAssignments.remarks,
      })
      .from(deliveryAssignments)
      .innerJoin(deliveryPersons, eq(deliveryAssignments.deliveryPersonId, deliveryPersons.id))
      .where(eq(deliveryAssignments.orderId, orderId)),
  ]);

  const payment = paymentRows[0];
  const assign  = assignRows[0];

  return {
    id:          row.id,
    orderNumber: row.orderNumber,
    status:      row.status,
    totalAmount: row.totalAmount ?? "0",
    createdAt:   row.createdAt,
    notes:       row.notes,
    customer: {
      id:            row.customerId,
      businessName:  row.businessName,
      contactPerson: row.contactPerson,
      phone:         row.phone,
      address:       row.address,
    },
    lineItems,
    payment:  payment ?? null,
    delivery: assign  ?? null,
  };
}
