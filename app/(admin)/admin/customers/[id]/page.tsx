import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { StatusBadge } from "@/components/shared/status-badge";
import { getCustomerById } from "@/lib/db/queries/customers";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate } from "@/lib/utils/format-date";
import { formatOrderNumber } from "@/lib/utils/format-order-number";
import type { OrderStatus } from "@/components/shared/status-badge";

export const metadata: Metadata = { title: "Customer Profile" };

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomerById(id);
  if (!customer) notFound();

  const latestDeposit = customer.deposits[0] ?? null;

  return (
    <>
      <TopBar title="Customer Profile" backHref="/admin/customers" />
      <div className="flex-1 p-4 space-y-4">

        {/* Profile card */}
        <div className="glass rounded-2xl p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-bold text-lg text-slate-900 dark:text-slate-50">{customer.businessName}</h2>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {customer.contactPerson} · {customer.phone.replace("+91", "+91 ")}
              </p>
            </div>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                customer.isActive
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
              }`}
            >
              {customer.isActive ? "Active" : "Inactive"}
            </span>
          </div>

          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{customer.address}</p>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Eligibility Limit</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-50 tabular">
                {customer.eligibilityLimit} cyl
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Orders</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-50 tabular">
                {customer.orderHistory.length}
              </p>
            </div>
          </div>

          {customer.createdAt && (
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Customer since {formatDate(customer.createdAt)}
            </p>
          )}
        </div>

        {/* Caution deposit */}
        {latestDeposit ? (
          <div className="glass-sm rounded-xl p-4 space-y-2">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Caution Deposit
            </p>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Amount</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-50 tabular">
                {formatCurrency(latestDeposit.amount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Paid on</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {formatDate(latestDeposit.paidOn)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Mode</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-50 capitalize">
                {latestDeposit.paymentMode.replace("_", " ")}
              </span>
            </div>
            {latestDeposit.referenceNo && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Reference</span>
                <span className="text-sm font-mono text-slate-700 dark:text-slate-300">
                  {latestDeposit.referenceNo}
                </span>
              </div>
            )}
            {latestDeposit.notes && (
              <p className="text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                {latestDeposit.notes}
              </p>
            )}
          </div>
        ) : (
          <div className="glass-sm rounded-xl p-4 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">No caution deposit recorded</p>
          </div>
        )}

        {/* Order history */}
        <section>
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
            Order History
          </h3>
          {customer.orderHistory.length === 0 ? (
            <div className="glass-sm rounded-xl p-6 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {customer.orderHistory.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="glass-sm rounded-xl px-4 py-3 flex items-center gap-3 hover:shadow-sm transition-shadow"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono font-bold text-slate-900 dark:text-slate-50">
                      {formatOrderNumber(order.orderNumber)}
                    </p>
                    {order.createdAt && (
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {formatDate(order.createdAt)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={order.status as OrderStatus} />
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-50 tabular">
                      {formatCurrency(order.totalAmount ?? "0")}
                    </span>
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
