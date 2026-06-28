import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { StatusBadge } from "@/components/shared/status-badge";
import { Plus, ChevronRight, ShoppingCart } from "lucide-react";
import type { OrderStatus } from "@/components/shared/status-badge";
import { getCurrentUser } from "@/lib/db/queries/auth";
import { getCustomerForUser } from "@/lib/db/queries/customers";
import { getCustomerOrders } from "@/lib/db/queries/customer-orders";
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
      <div className="flex-1 p-4 space-y-3 relative pb-safe-nav">

        {orders.length === 0 && (
          <div className="glass-sm rounded-2xl p-8 text-center space-y-3 mt-4">
            <ShoppingCart className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              No orders yet
            </p>
            <Link
              href="/orders/new"
              className="inline-block text-sm font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
            >
              Place your first booking →
            </Link>
          </div>
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
                ₹{Number(order.totalAmount).toLocaleString("en-IN")}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </Link>
        ))}

        {/* FAB */}
        <Link
          href="/orders/new"
          className="fixed bottom-24 right-4 md:bottom-6 w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 flex items-center justify-center shadow-lg text-white transition-all"
          aria-label="New booking"
        >
          <Plus className="w-6 h-6" />
        </Link>
      </div>
    </>
  );
}
