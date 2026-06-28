import { desc, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import pgClient from "@/lib/db/client";
import { orders, customers } from "@/lib/db/schema";
import { ORDER_FILTER_GROUPS } from "@/lib/config/order-filters";
import type { OrderFilterKey } from "@/lib/config/order-filters";

export type { OrderFilterKey } from "@/lib/config/order-filters";
export { ORDER_FILTER_GROUPS } from "@/lib/config/order-filters";

const db = drizzle(pgClient);

export type OrderRow = {
  id: string;
  orderNumber: number;
  status: string;
  totalAmount: string | null;
  createdAt: Date | null;
  businessName: string;
};

export async function getOrders(filter: OrderFilterKey = "all"): Promise<OrderRow[]> {
  const statuses = ORDER_FILTER_GROUPS[filter];

  const query = db
    .select({
      id:           orders.id,
      orderNumber:  orders.orderNumber,
      status:       orders.status,
      totalAmount:  orders.totalAmount,
      createdAt:    orders.createdAt,
      businessName: customers.businessName,
    })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .orderBy(desc(orders.createdAt))
    .limit(100);

  if (statuses) {
    return query.where(inArray(orders.status, statuses as string[]));
  }

  return query;
}
