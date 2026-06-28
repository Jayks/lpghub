import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageWrapper } from "@/components/shared/page-wrapper";
import { EmptyState } from "@/components/shared/empty-state";
import { OrderFilterPills } from "@/components/admin/order-filter-pills";
import { OrderSearchBar } from "@/components/admin/order-search-bar";
import { getOrders } from "@/lib/db/queries/orders";
import { ORDER_FILTER_GROUPS } from "@/lib/config/order-filters";
import type { OrderFilterKey } from "@/lib/config/order-filters";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate } from "@/lib/utils/format-date";
import { formatOrderNumber } from "@/lib/utils/format-order-number";
import type { OrderStatus } from "@/components/shared/status-badge";
import { ChevronRight, ShoppingCart, SearchX } from "lucide-react";

export const metadata: Metadata = { title: "Orders" };

function isValidFilter(v: unknown): v is OrderFilterKey {
  return typeof v === "string" && v in ORDER_FILTER_GROUPS;
}

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const rawFilter = Array.isArray(params.filter) ? params.filter[0] : params.filter;
  const activeFilter: OrderFilterKey = isValidFilter(rawFilter) ? rawFilter : "all";

  const q    = str(Array.isArray(params.q)    ? params.q[0]    : params.q);
  const from = str(Array.isArray(params.from) ? params.from[0] : params.from);
  const to   = str(Array.isArray(params.to)   ? params.to[0]   : params.to);

  const orderList = await getOrders({ filter: activeFilter, q, from, to });
  const hasSearch = !!(q || from || to);

  return (
    <>
      <TopBar title="Orders" />
      <PageWrapper className="flex-1 p-4 space-y-4">

        {/* Search bar + filter pills */}
        <Suspense fallback={
          <div className="space-y-2">
            <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            <div className="h-9 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          </div>
        }>
          <div className="space-y-3">
            <OrderSearchBar initialQ={q} initialFrom={from} initialTo={to} />
            <OrderFilterPills active={activeFilter} />
          </div>
        </Suspense>

        {/* Result count */}
        {orderList.length > 0 && (
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {orderList.length} order{orderList.length !== 1 ? "s" : ""}
            {hasSearch && " matching your search"}
          </p>
        )}

        {/* Empty state */}
        {orderList.length === 0 && (
          hasSearch ? (
            <EmptyState
              icon={SearchX}
              title="No orders found"
              description="Try a different search term, date range, or status filter."
            />
          ) : (
            <EmptyState
              icon={ShoppingCart}
              title="No orders found"
              description={
                activeFilter === "all"
                  ? "Orders will appear here once customers start booking."
                  : "No orders match this filter."
              }
            />
          )
        )}

        {orderList.length > 0 && (
          <>
            {/* ── Desktop table (md+) ─────────────────────────────────────── */}
            <div className="hidden md:block glass rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200/60 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-800/60">
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Order #</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Customer</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                    <th className="w-8 px-2 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {orderList.map((order) => (
                    <tr
                      key={order.id}
                      className="group hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300"
                        >
                          {formatOrderNumber(order.orderNumber)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 max-w-[16rem]">
                        <Link href={`/admin/orders/${order.id}`} className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate block">
                          {order.businessName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link href={`/admin/orders/${order.id}`} className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {order.createdAt ? formatDate(order.createdAt) : "—"}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/orders/${order.id}`} className="inline-flex">
                          <StatusBadge status={order.status as OrderStatus} />
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-50 tabular-nums">
                          {formatCurrency(order.totalAmount ?? "0")}
                        </span>
                      </td>
                      <td className="px-2 py-3">
                        <Link href={`/admin/orders/${order.id}`} aria-label="View order">
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 dark:text-slate-600 dark:group-hover:text-slate-400 transition-colors" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Mobile cards ─────────────────────────────────────────────── */}
            <div className="md:hidden space-y-2">
              {orderList.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="glass-sm rounded-xl px-4 py-3.5 block hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                      {formatOrderNumber(order.orderNumber)}
                    </span>
                    <StatusBadge status={order.status as OrderStatus} />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate">
                      {order.businessName}
                      {order.createdAt && ` · ${formatDate(order.createdAt)}`}
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-50 tabular-nums">
                        {formatCurrency(order.totalAmount ?? "0")}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

      </PageWrapper>
    </>
  );
}
