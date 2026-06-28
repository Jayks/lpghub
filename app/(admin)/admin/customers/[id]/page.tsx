import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageWrapper } from "@/components/shared/page-wrapper";
import { getCustomerById } from "@/lib/db/queries/customers";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate } from "@/lib/utils/format-date";
import { formatOrderNumber } from "@/lib/utils/format-order-number";
import type { OrderStatus } from "@/components/shared/status-badge";
import { CustomerActiveToggle } from "@/components/admin/customer-active-toggle";
import { Pencil } from "lucide-react";

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
      <TopBar breadcrumbs={[
        { label: "Customers", href: "/admin/customers" },
        { label: customer.businessName },
      ]} />
      <PageWrapper className="flex-1 p-4 space-y-4">

        {/* Profile card */}
        <div className="glass rounded-2xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-bold text-lg text-slate-900 dark:text-slate-50">{customer.businessName}</h2>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {customer.contactPerson} · {customer.phone.replace("+91", "+91 ")}
              </p>
            </div>
            <Link
              href={`/admin/customers/${id}/edit`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[36px] shrink-0"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </Link>
          </div>

          {/* Active / Inactive toggle */}
          <CustomerActiveToggle id={id} isActive={customer.isActive} />

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
      </PageWrapper>
    </>
  );
}
