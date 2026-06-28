import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import pgClient from "@/lib/db/client";
import {
  deliveryAssignments,
  deliveryPersons,
  orders,
  customers,
  orderLineItems,
  cylinderTypes,
} from "@/lib/db/schema";


const db = drizzle(pgClient);

// ─── Admin — confirmed orders with no assignment yet ──────────────────────────

export type UnassignedOrderRow = {
  orderId: string;
  orderNumber: number;
  totalAmount: string;
  businessName: string;
  address: string;
  createdAt: Date | null;
};

export async function getUnassignedOrders(): Promise<UnassignedOrderRow[]> {
  return db
    .select({
      orderId:      orders.id,
      orderNumber:  orders.orderNumber,
      totalAmount:  orders.totalAmount,
      businessName: customers.businessName,
      address:      customers.address,
      createdAt:    orders.createdAt,
    })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .leftJoin(deliveryAssignments, eq(deliveryAssignments.orderId, orders.id))
    .where(and(eq(orders.status, "confirmed"), isNull(deliveryAssignments.id)))
    .orderBy(desc(orders.createdAt));
}

// ─── Admin — active deliveries (assigned / out_for_delivery) ──────────────────

export type ActiveDeliveryRow = {
  assignmentId: string;
  orderId: string;
  orderNumber: number;
  businessName: string;
  totalAmount: string;
  deliveryPersonName: string;
  deliveryPersonPhone: string;
  status: string;
  assignedAt: Date | null;
  dispatchedAt: Date | null;
};

export async function getActiveDeliveries(): Promise<ActiveDeliveryRow[]> {
  return db
    .select({
      assignmentId:        deliveryAssignments.id,
      orderId:             orders.id,
      orderNumber:         orders.orderNumber,
      businessName:        customers.businessName,
      totalAmount:         orders.totalAmount,
      deliveryPersonName:  deliveryPersons.name,
      deliveryPersonPhone: deliveryPersons.phone,
      status:              deliveryAssignments.status,
      assignedAt:          deliveryAssignments.assignedAt,
      dispatchedAt:        deliveryAssignments.dispatchedAt,
    })
    .from(deliveryAssignments)
    .innerJoin(orders,          eq(deliveryAssignments.orderId,          orders.id))
    .innerJoin(customers,       eq(orders.customerId,                    customers.id))
    .innerJoin(deliveryPersons, eq(deliveryAssignments.deliveryPersonId, deliveryPersons.id))
    .where(inArray(deliveryAssignments.status, ["assigned", "out_for_delivery"]))
    .orderBy(desc(deliveryAssignments.assignedAt));
}

// ─── Shared — list active delivery persons (for assignment dropdown) ──────────

export type DeliveryPersonRow = {
  id: string;
  name: string;
  phone: string;
};

export async function getDeliveryPersons(): Promise<DeliveryPersonRow[]> {
  return db
    .select({ id: deliveryPersons.id, name: deliveryPersons.name, phone: deliveryPersons.phone })
    .from(deliveryPersons)
    .where(eq(deliveryPersons.isActive, true))
    .orderBy(deliveryPersons.name);
}

// ─── Admin — full list including inactive (for team management view) ──────────

export type DeliveryPersonAdminRow = {
  id: string;
  name: string;
  phone: string;
  isActive: boolean;
  createdAt: Date | null;
};

export async function getAllDeliveryPersons(): Promise<DeliveryPersonAdminRow[]> {
  return db
    .select({
      id:        deliveryPersons.id,
      name:      deliveryPersons.name,
      phone:     deliveryPersons.phone,
      isActive:  deliveryPersons.isActive,
      createdAt: deliveryPersons.createdAt,
    })
    .from(deliveryPersons)
    .orderBy(deliveryPersons.name);
}

// ─── Delivery-person view — active assignments for a given user ───────────────

export type MyDeliveryRow = {
  assignmentId: string;
  orderId: string;
  orderNumber: number;
  businessName: string;
  address: string;
  linesSummary: string;
  status: string;
  assignedAt: Date | null;
};

export async function getMyDeliveries(
  deliveryPersonAuthUserId: string
): Promise<MyDeliveryRow[]> {
  // Pull individual line items so we can build a summary string
  const rows = await db
    .select({
      assignmentId: deliveryAssignments.id,
      orderId:      orders.id,
      orderNumber:  orders.orderNumber,
      businessName: customers.businessName,
      address:      customers.address,
      status:       deliveryAssignments.status,
      assignedAt:   deliveryAssignments.assignedAt,
      label:        cylinderTypes.label,
      quantity:     orderLineItems.quantity,
    })
    .from(deliveryAssignments)
    .innerJoin(deliveryPersons, eq(deliveryAssignments.deliveryPersonId, deliveryPersons.id))
    .innerJoin(orders,          eq(deliveryAssignments.orderId,          orders.id))
    .innerJoin(customers,       eq(orders.customerId,                    customers.id))
    .leftJoin(orderLineItems,   eq(orderLineItems.orderId,               orders.id))
    .leftJoin(cylinderTypes,    eq(orderLineItems.cylinderTypeId,        cylinderTypes.id))
    .where(
      and(
        eq(deliveryPersons.authUserId, deliveryPersonAuthUserId),
        inArray(deliveryAssignments.status, ["assigned", "out_for_delivery"])
      )
    )
    .orderBy(desc(deliveryAssignments.assignedAt));

  // Group by assignment, aggregate line summary
  const map = new Map<string, MyDeliveryRow>();
  for (const row of rows) {
    if (!map.has(row.assignmentId)) {
      map.set(row.assignmentId, {
        assignmentId: row.assignmentId,
        orderId:      row.orderId,
        orderNumber:  row.orderNumber,
        businessName: row.businessName,
        address:      row.address,
        linesSummary: "",
        status:       row.status,
        assignedAt:   row.assignedAt,
      });
    }
    if (row.label && row.quantity) {
      const entry = map.get(row.assignmentId)!;
      const part = `${row.quantity}× ${row.label}`;
      entry.linesSummary = entry.linesSummary ? `${entry.linesSummary}, ${part}` : part;
    }
  }
  return [...map.values()];
}

// ─── Delivery-person view — get delivery person by auth user ID ───────────────

export async function getDeliveryPersonByAuthUserId(
  authUserId: string
): Promise<{ id: string; name: string; phone: string } | null> {
  const [row] = await db
    .select({ id: deliveryPersons.id, name: deliveryPersons.name, phone: deliveryPersons.phone })
    .from(deliveryPersons)
    .where(eq(deliveryPersons.authUserId, authUserId));
  return row ?? null;
}

// ─── Delivery-person view — single assignment detail ─────────────────────────

export type DeliveryDetail = {
  assignmentId: string;
  orderId: string;
  status: string;
  remarks: string | null;
  assignedAt: Date | null;
  dispatchedAt: Date | null;
  businessName: string;
  contactPerson: string;
  phone: string;
  address: string;
  lineItems: Array<{ label: string; quantity: number }>;
};

export async function getDeliveryDetail(
  assignmentId: string
): Promise<DeliveryDetail | null> {
  const [row] = await db
    .select({
      assignmentId:  deliveryAssignments.id,
      orderId:       orders.id,
      status:        deliveryAssignments.status,
      remarks:       deliveryAssignments.remarks,
      assignedAt:    deliveryAssignments.assignedAt,
      dispatchedAt:  deliveryAssignments.dispatchedAt,
      businessName:  customers.businessName,
      contactPerson: customers.contactPerson,
      phone:         customers.phone,
      address:       customers.address,
    })
    .from(deliveryAssignments)
    .innerJoin(orders,    eq(deliveryAssignments.orderId, orders.id))
    .innerJoin(customers, eq(orders.customerId,           customers.id))
    .where(eq(deliveryAssignments.id, assignmentId));

  if (!row) return null;

  const lines = await db
    .select({ label: cylinderTypes.label, quantity: orderLineItems.quantity })
    .from(orderLineItems)
    .innerJoin(cylinderTypes, eq(orderLineItems.cylinderTypeId, cylinderTypes.id))
    .where(eq(orderLineItems.orderId, row.orderId));

  return { ...row, lineItems: lines };
}
