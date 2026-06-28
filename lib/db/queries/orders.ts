import { desc, eq, inArray, ilike, or, and, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import pgClient from "@/lib/db/client";
import { orders, customers } from "@/lib/db/schema";
import { ORDER_FILTER_GROUPS } from "@/lib/config/order-filters";
import type { OrderFilterKey } from "@/lib/config/order-filters";
import { parseOrderSearch } from "./parse-order-search";

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

export interface OrderFilters {
  filter?: OrderFilterKey;
  /** Free-text search — matches business name (ilike) or exact order number */
  q?: string;
  /** ISO date string (YYYY-MM-DD) — inclusive start of createdAt range */
  from?: string;
  /** ISO date string (YYYY-MM-DD) — inclusive end of createdAt range (end of day) */
  to?: string;
}

export async function getOrders(params: OrderFilters | OrderFilterKey = "all"): Promise<OrderRow[]> {
  // Accept the old single-string signature for backwards compat
  const { filter = "all", q, from, to } =
    typeof params === "string" ? { filter: params, q: undefined, from: undefined, to: undefined } : params;

  const statuses = ORDER_FILTER_GROUPS[filter];

  // Build WHERE conditions dynamically
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conditions: any[] = [];

  // Status filter
  if (statuses) {
    conditions.push(inArray(orders.status, statuses as string[]));
  }

  // Free-text search: business name ilike OR exact order number
  if (q) {
    const { term, orderNumber } = parseOrderSearch(q);
    if (term) {
      conditions.push(
        orderNumber !== null
          ? or(ilike(customers.businessName, `%${term}%`), eq(orders.orderNumber, orderNumber))
          : ilike(customers.businessName, `%${term}%`)
      );
    }
  }

  // Date range (createdAt)
  if (from) {
    conditions.push(gte(orders.createdAt, new Date(`${from}T00:00:00.000Z`)));
  }
  if (to) {
    conditions.push(lte(orders.createdAt, new Date(`${to}T23:59:59.999Z`)));
  }

  return db
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
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(orders.createdAt))
    .limit(200);
}
