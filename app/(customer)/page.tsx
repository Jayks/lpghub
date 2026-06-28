import type { Metadata } from "next";
import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { StatusBadge } from "@/components/shared/status-badge";
import { getCurrentUser } from "@/lib/db/queries/auth";
import { getCustomerForUser } from "@/lib/db/queries/customers";
import { getCustomerOrders } from "@/lib/db/queries/customer-orders";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate } from "@/lib/utils/format-date";
import { formatOrderNumber } from "@/lib/utils/format-order-number";
import { ShoppingCart, Clock, ChevronRight } from "lucide-react";
import type { OrderStatus } from "@/components/shared/status-badge";

export const metadata: Metadata = { title: "Home" };

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default async function CustomerHomePage() {
  const user = await getCurrentUser();
  const customer = user ? await getCustomerForUser(user.id, user.phone) : null;
  const displayName = customer?.businessName ?? "there";

  const recentOrders = customer
    ? (await getCustomerOrders(customer.id)).slice(0, 3)
    : [];

  return (
    <>
      <TopBar title="LPGHub" />
      <div className="flex-1 p-4 space-y-6 pb-safe-nav">

        {/* Greeting */}
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{greeting()},</p>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            {displayName} 👋
          </h2>
          {customer && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Eligibility: up to {customer.eligibilityLimit} cylinders per order
            </p>
          )}
        </div>

        {/* Book CTA */}
        {customer ? (
          <Link
            href="/orders/new"
            className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-br from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" />
            Book Cylinders
          </Link>
        ) : (
          <div className="glass-sm rounded-2xl p-4 text-center space-y-1">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Account not linked
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Contact your agency admin to activate your account.
            </p>
          </div>
        )}

        {/* Recent orders */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Recent Orders
            </h3>
            {recentOrders.length > 0 && (
              <Link
                href="/orders"
                className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                View all
              </Link>
            )}
          </div>

          {recentOrders.length === 0 ? (
            <div className="glass-sm rounded-2xl p-6 text-center space-y-2">
              <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {customer ? "No orders yet — tap Book Cylinders to get started" : "Your orders will appear here"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="glass-sm rounded-xl px-4 py-3 flex items-center gap-3 hover:shadow-sm transition-shadow"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-50">
                        {formatOrderNumber(order.orderNumber)}
                      </span>
                      <StatusBadge status={order.status as OrderStatus} />
                    </div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {order.linesSummary || "—"}
                      {order.createdAt ? ` · ${formatDate(order.createdAt)}` : ""}
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
            </div>
          )}
        </section>
      </div>
    </>
  );
}
