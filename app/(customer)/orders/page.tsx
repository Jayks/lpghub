import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageWrapper } from "@/components/shared/page-wrapper";
import { EmptyState } from "@/components/shared/empty-state";
import { Plus, ChevronRight, ShoppingCart } from "lucide-react";
import type { OrderStatus } from "@/components/shared/status-badge";
import { getCurrentUser } from "@/lib/db/queries/auth";
import { getCustomerForUser } from "@/lib/db/queries/customers";
import { getCustomerOrders } from "@/lib/db/queries/customer-orders";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate } from "@/lib/utils/format-date";
import { formatOrderNumber } from "@/lib/utils/format-order-number";

export const metadata: Metadata = { title: "My Orders" };

export default async function CustomerOrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const customer = await getCustomerForUser(user.id, user.phone);
  if (!customer) redirect("/");

  const orders = await getCustomerOrders(customer.id);

  return (
    <>
      <TopBar title="My Orders" />
      <PageWrapper className="flex-1 p-4 space-y-3 relative pb-safe-nav">

        {orders.length === 0 && (
          <EmptyState
            icon={ShoppingCart}
            title="No orders yet"
            description="Once you place a booking it will appear here."
            action={
              <Link
                href="/orders/new"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                Place your first booking →
              </Link>
            }
          />
        )}

        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/orders/${order.id}`}
            className="glass-sm rounded-xl px-4 py-4 flex items-center gap-3 hover:shadow-sm transition-shadow"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-sm font-bold text-slate-900 dark:text-slate-50">
                  {formatOrderNumber(order.orderNumber)}
                </span>
                <StatusBadge status={order.status as OrderStatus} />
              </div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {order.linesSummary || "—"} · {order.createdAt ? formatDate(order.createdAt) : "—"}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-50 tabular-nums">
                {formatCurrency(order.totalAmount)}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </Link>
        ))}

        {/* FAB — new booking */}
        <Link
          href="/orders/new"
          className="fixed bottom-24 right-4 md:bottom-6 w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 flex items-center justify-center shadow-lg text-white transition-all active:scale-95"
          aria-label="New booking"
        >
          <Plus className="w-6 h-6" />
        </Link>
      </PageWrapper>
    </>
  );
}
