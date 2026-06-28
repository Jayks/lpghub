import {
  count, sum, eq, lt, and, gte, lte, isNull, inArray,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { startOfToday, startOfMonth, endOfMonth, subMonths } from "date-fns";
import pgClient from "@/lib/db/client";
import {
  customers,
  orders,
  inventory,
  cylinderTypes,
  deliveryAssignments,
} from "@/lib/db/schema";

const db = drizzle(pgClient);

const LOW_STOCK_THRESHOLD = 10;

// ─── helpers ─────────────────────────────────────────────────────────────────

const parseSum = (v: string | null | undefined): number =>
  parseFloat(v ?? "0") || 0;

// ─── main query ───────────────────────────────────────────────────────────────

export async function getAdminStats() {
  // Note: "today" and "this month" are computed in UTC.
  // Deployments in IST (UTC+5:30) will see a ~5.5 h offset — acceptable for a demo app.
  const todayStart    = startOfToday();
  const monthStart    = startOfMonth(new Date());
  const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
  const lastMonthEnd   = endOfMonth(subMonths(new Date(), 1));

  const [
    activeCustomersRow,
    pendingPaymentsRow,      // payment_pending_confirmation
    pendingPaymentOrdersRow, // pending_payment (customer hasn't paid yet)
    totalOrdersRow,
    awaitingAssignmentRow,   // confirmed + no delivery assignment
    activeDeliveriesRow,     // out_for_delivery
    deliveredTodayRow,
    revTodayRow,
    revMonthRow,
    revLastMonthRow,
    newCustomersMonthRow,
    ordersMonthRow,
    pendingRevenueRow,
    lowStockItems,
    inventoryData,
  ] = await Promise.all([

    // ── needs attention ────────────────────────────────────────────────────

    db.select({ count: count() })
      .from(customers)
      .where(eq(customers.isActive, true)),

    db.select({ count: count() })
      .from(orders)
      .where(eq(orders.status, "payment_pending_confirmation")),

    db.select({ count: count() })
      .from(orders)
      .where(eq(orders.status, "pending_payment")),

    db.select({ count: count() })
      .from(orders),

    // confirmed orders that have no delivery assignment yet
    db.select({ count: count() })
      .from(orders)
      .leftJoin(deliveryAssignments, eq(orders.id, deliveryAssignments.orderId))
      .where(and(
        eq(orders.status, "confirmed"),
        isNull(deliveryAssignments.id),
      )),

    db.select({ count: count() })
      .from(orders)
      .where(eq(orders.status, "out_for_delivery")),

    // ── today ──────────────────────────────────────────────────────────────

    db.select({ count: count() })
      .from(deliveryAssignments)
      .where(and(
        eq(deliveryAssignments.status, "delivered"),
        gte(deliveryAssignments.deliveredAt, todayStart),
      )),

    db.select({ total: sum(orders.totalAmount) })
      .from(orders)
      .innerJoin(deliveryAssignments, eq(orders.id, deliveryAssignments.orderId))
      .where(and(
        eq(deliveryAssignments.status, "delivered"),
        gte(deliveryAssignments.deliveredAt, todayStart),
      )),

    // ── this month ─────────────────────────────────────────────────────────

    db.select({ total: sum(orders.totalAmount) })
      .from(orders)
      .innerJoin(deliveryAssignments, eq(orders.id, deliveryAssignments.orderId))
      .where(and(
        eq(deliveryAssignments.status, "delivered"),
        gte(deliveryAssignments.deliveredAt, monthStart),
      )),

    db.select({ total: sum(orders.totalAmount) })
      .from(orders)
      .innerJoin(deliveryAssignments, eq(orders.id, deliveryAssignments.orderId))
      .where(and(
        eq(deliveryAssignments.status, "delivered"),
        gte(deliveryAssignments.deliveredAt, lastMonthStart),
        lte(deliveryAssignments.deliveredAt, lastMonthEnd),
      )),

    db.select({ count: count() })
      .from(customers)
      .where(gte(customers.createdAt, monthStart)),

    db.select({ count: count() })
      .from(orders)
      .where(gte(orders.createdAt, monthStart)),

    // value locked in unconfirmed / unpaid orders
    db.select({ total: sum(orders.totalAmount) })
      .from(orders)
      .where(inArray(orders.status, ["pending_payment", "payment_pending_confirmation"])),

    // ── inventory ──────────────────────────────────────────────────────────

    db.select({ label: cylinderTypes.label, availableStock: inventory.availableStock })
      .from(inventory)
      .innerJoin(cylinderTypes, eq(inventory.cylinderTypeId, cylinderTypes.id))
      .where(lt(inventory.availableStock, LOW_STOCK_THRESHOLD)),

    db.select({
      label:          cylinderTypes.label,
      totalStock:     inventory.totalStock,
      availableStock: inventory.availableStock,
      reservedStock:  inventory.reservedStock,
      deliveredStock: inventory.deliveredStock,
    })
      .from(inventory)
      .innerJoin(cylinderTypes, eq(inventory.cylinderTypeId, cylinderTypes.id))
      .orderBy(cylinderTypes.label),
  ]);

  const revenueThisMonth = parseSum(revMonthRow[0]?.total);
  const revenueLastMonth = parseSum(revLastMonthRow[0]?.total);

  const revenueTrend: number | null =
    revenueLastMonth > 0
      ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
      : null;

  return {
    // Needs Attention
    activeCustomers:     activeCustomersRow[0].count,
    pendingPayments:     pendingPaymentsRow[0].count,      // payment_pending_confirmation
    pendingPaymentOrders: pendingPaymentOrdersRow[0].count, // awaiting customer payment
    totalOrders:         totalOrdersRow[0].count,
    awaitingAssignment:  awaitingAssignmentRow[0].count,
    activeDeliveries:    activeDeliveriesRow[0].count,
    lowStockItems,

    // Today
    deliveredToday: deliveredTodayRow[0].count,
    revenueToday:   parseSum(revTodayRow[0]?.total),

    // This Month
    revenueThisMonth,
    revenueLastMonth,
    revenueTrend,
    ordersThisMonth:        ordersMonthRow[0].count,
    newCustomersThisMonth:  newCustomersMonthRow[0].count,
    pendingRevenue:         parseSum(pendingRevenueRow[0]?.total),

    // Inventory detail
    inventoryData,
  };
}

// ─── Lightweight urgent-count query for nav badges ────────────────────────────
// Used by admin layout to show notification dots in the sidebar / bottom nav.

export async function getAdminUrgentCounts(): Promise<{
  payments: number;
  deliveries: number;
}> {
  const [paymentsRow, deliveriesRow] = await Promise.all([
    db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.status, "payment_pending_confirmation")),

    db
      .select({ count: count() })
      .from(orders)
      .leftJoin(deliveryAssignments, eq(orders.id, deliveryAssignments.orderId))
      .where(and(eq(orders.status, "confirmed"), isNull(deliveryAssignments.id))),
  ]);

  return {
    payments:   paymentsRow[0]?.count   ?? 0,
    deliveries: deliveriesRow[0]?.count ?? 0,
  };
}
