import { count, eq, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import pgClient from "@/lib/db/client";
import { customers, orders, inventory, cylinderTypes } from "@/lib/db/schema";

const db = drizzle(pgClient);

const LOW_STOCK_THRESHOLD = 10;

export async function getAdminStats() {
  const [activeCustomers] = await db
    .select({ count: count() })
    .from(customers)
    .where(eq(customers.isActive, true));

  const [pendingPayments] = await db
    .select({ count: count() })
    .from(orders)
    .where(eq(orders.status, "payment_pending_confirmation"));

  const [totalOrders] = await db
    .select({ count: count() })
    .from(orders);

  const lowStockItems = await db
    .select({ label: cylinderTypes.label, availableStock: inventory.availableStock })
    .from(inventory)
    .innerJoin(cylinderTypes, eq(inventory.cylinderTypeId, cylinderTypes.id))
    .where(lt(inventory.availableStock, LOW_STOCK_THRESHOLD));

  return {
    activeCustomers: activeCustomers.count,
    pendingPayments: pendingPayments.count,
    totalOrders: totalOrders.count,
    lowStockItems,
  };
}
