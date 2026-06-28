import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { StatusBadge } from "@/components/shared/status-badge";
import { OrderFilterPills } from "@/components/admin/order-filter-pills";
import { getOrders } from "@/lib/db/queries/orders";
import { ORDER_FILTER_GROUPS } from "@/lib/config/order-filters";
import type { OrderFilterKey } from "@/lib/config/order-filters";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate } from "@/lib/utils/format-date";
import { formatOrderNumber } from "@/lib/utils/format-order-number";
import type { OrderStatus } from "@/components/shared/status-badge";
import { ChevronRight, ShoppingCart } from "lucide-react";

export const metadata: Metadata = { title: "Orders" };

function isValidFilter(v: unknown): v is OrderFilterKey {
  return typeof v === "string" && v in ORDER_FILTER_GROUPS;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawFilter = Array.isArray(params.filter) ? params.filter[0] : params.filter;
  const activeFilter: OrderFilterKey = isValidFilter(rawFilter) ? rawFilter : "all";

  const orderList = await getOrders(activeFilter);

  return (
    <>
      <TopBar title="Orders" />
      <div className="flex-1 p-4 space-y-4">

        {/* Filter pills — wrapped in Suspense because useSearchParams needs it */}
        <Suspense fallback={<div className="h-8" />}>
          <OrderFilterPills active={activeFilter} />
        </Suspense>

        {/* Count */}
        {orderList.length > 0 && (
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {orderList.length} order{orderList.length !== 1 ? "s" : ""}
          </p>
        )}

        {/* Order list */}
        {orderList.length === 0 ? (
          <div className="glass-sm rounded-2xl p-10 text-center space-y-2">
            <ShoppingCart className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="font-semibold text-slate-700 dark:text-slate-200">No orders found</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {activeFilter === "all"
                ? "Orders will appear here once customers start booking."
                : "No orders match this filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {orderList.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="glass-sm rounded-xl px-4 py-3.5 flex items-center gap-3 hover:shadow-sm transition-shadow"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                      {formatOrderNumber(order.orderNumber)}
                    </span>
                    <StatusBadge status={order.status as OrderStatus} />
                  </div>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate">
                    {order.businessName}
                    {order.createdAt && ` · ${formatDate(order.createdAt)}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-50 tabular">
                    {formatCurrency(order.totalAmount ?? "0")}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
