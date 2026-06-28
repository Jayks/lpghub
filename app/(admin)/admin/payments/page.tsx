import type { Metadata } from "next";
import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { PageWrapper } from "@/components/shared/page-wrapper";
import { EmptyState } from "@/components/shared/empty-state";
import { Clock, CreditCard, CheckCircle2, XCircle } from "lucide-react";
import { getPendingPayments, getAwaitingPaymentOrders, getPaymentHistory } from "@/lib/db/queries/payments";
import { PaymentActionButtons } from "@/components/admin/payment-action-buttons";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatRelative } from "@/lib/utils/format-date";
import { formatOrderNumber } from "@/lib/utils/format-order-number";
import { isToday, isYesterday, format } from "date-fns";

export const metadata: Metadata = { title: "Payments" };

/** Returns e.g. "Today, 9:07 PM" / "Yesterday, 4:59 PM" / "26 Jun, 4:59 PM" */
function formatPaymentDate(date: Date | null): string {
  if (!date) return "—";
  const d = new Date(date);
  const time = format(d, "h:mm a");
  if (isToday(d))     return `Today, ${time}`;
  if (isYesterday(d)) return `Yesterday, ${time}`;
  return `${format(d, "d MMM")}, ${time}`;
}

export default async function AdminPaymentsPage() {
  const [pending, awaiting, history] = await Promise.all([
    getPendingPayments(),
    getAwaitingPaymentOrders(),
    getPaymentHistory(),
  ]);

  return (
    <>
      <TopBar title="Payments" />
      <PageWrapper className="flex-1 p-4 space-y-6 pb-safe-nav">

        {/* ── Section 1: Pending Confirmation ────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Pending Confirmation
            </h2>
            {pending.length > 0 && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 font-semibold">
                {pending.length} action{pending.length !== 1 ? "s" : ""} needed
              </span>
            )}
          </div>

          {pending.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="All clear"
              description="No payments are awaiting confirmation right now."
              compact
            />
          ) : (
            <div className="space-y-3">
              {pending.map((item) => (
                <div key={item.paymentId} className="glass rounded-2xl p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/admin/orders/${item.orderId}?from=payments`}
                        className="font-bold text-slate-900 dark:text-slate-50 truncate hover:underline block"
                      >
                        {item.businessName}
                      </Link>
                      <p className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                        {formatOrderNumber(item.orderNumber)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {item.phone} · {item.createdAt ? formatRelative(item.createdAt) : "—"}
                      </p>
                    </div>
                    <p className="text-xl font-bold text-slate-900 dark:text-slate-50 tabular-nums shrink-0">
                      {formatCurrency(item.amount)}
                    </p>
                  </div>

                  <div className="rounded-xl px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Customer-reported UPI ref
                    </p>
                    <p className="text-sm font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {item.paymentRef ?? (
                        <span className="italic font-normal text-slate-400">Not provided</span>
                      )}
                    </p>
                  </div>

                  <PaymentActionButtons
                    paymentId={item.paymentId}
                    orderId={item.orderId}
                    existingRef={item.paymentRef}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Section 2: Awaiting Customer Payment ───────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Awaiting Customer Payment
            </h2>
            {awaiting.length > 0 && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 font-semibold">
                {awaiting.length} pending
              </span>
            )}
          </div>

          {awaiting.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No orders awaiting payment"
              description="Orders sent to UPI will appear here until the customer submits payment."
              compact
            />
          ) : (
            <div className="space-y-2">
              {awaiting.map((item) => (
                <Link
                  key={item.orderId}
                  href={`/admin/orders/${item.orderId}?from=payments`}
                  className="glass-sm rounded-xl px-4 py-3 flex items-center gap-3 active:scale-[0.98] transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">
                      {item.businessName}
                    </p>
                    <p className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
                      {formatOrderNumber(item.orderNumber)}
                      {item.createdAt ? ` · ${formatRelative(item.createdAt)}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-slate-50">
                      {formatCurrency(item.amount)}
                    </span>
                    <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── Section 3: Payment History ──────────────────────────────────── */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Payment History
          </h2>

          {history.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No payment history yet"
              description="Confirmed and rejected payments will appear here."
              compact
            />
          ) : (
            <>
              {/* ── Desktop table — single header, date as a column ── */}
              <div className="hidden md:block glass rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200/60 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-800/60">
                      <th className="w-8 px-4 py-3" />
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Customer</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Order</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">UPI Ref</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {history.map((row) => {
                      const href = `/admin/orders/${row.orderId}?from=payments`;
                      const linkCls = "block w-full h-full";
                      return (
                        <tr
                          key={row.paymentId}
                          className="group hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="px-4 py-3.5">
                            <Link href={href} className={`${linkCls} flex items-center`}>
                              {row.status === "confirmed"
                                ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                : <XCircle className="w-4 h-4 text-red-400" />}
                            </Link>
                          </td>
                          <td className="px-4 py-3.5 max-w-[14rem]">
                            <Link href={href} className={`${linkCls} text-sm font-semibold text-slate-900 dark:text-slate-50 truncate`}>
                              {row.businessName}
                            </Link>
                          </td>
                          <td className="px-4 py-3.5">
                            <Link href={href} className={`${linkCls} text-xs font-mono font-bold text-slate-600 dark:text-slate-400`}>
                              {formatOrderNumber(row.orderNumber)}
                            </Link>
                          </td>
                          <td className="px-4 py-3.5 max-w-[14rem]">
                            <Link href={href} className={`${linkCls} text-xs font-mono text-slate-500 dark:text-slate-400 truncate`}>
                              {row.paymentRef ?? "—"}
                            </Link>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <Link href={href} className={`${linkCls} text-sm font-bold tabular-nums justify-end ${
                              row.status === "confirmed"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-red-400 line-through"
                            }`}>
                              {formatCurrency(row.amount)}
                            </Link>
                          </td>
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <Link href={href} className={`${linkCls} text-xs text-slate-400 dark:text-slate-500 justify-end`}>
                              {formatPaymentDate(row.resolvedAt)}
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile cards ── */}
              <div className="md:hidden glass rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {history.map((row) => (
                  <Link
                    key={row.paymentId}
                    href={`/admin/orders/${row.orderId}?from=payments`}
                    className="flex items-center gap-3 px-4 py-3 active:bg-slate-50/60 dark:active:bg-slate-800/30 transition-colors"
                  >
                    {row.status === "confirmed"
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      : <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">
                        {row.businessName}
                      </p>
                      <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        {formatOrderNumber(row.orderNumber)}
                        {row.paymentRef ? ` · ${row.paymentRef}` : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold tabular-nums ${
                        row.status === "confirmed"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-400 line-through"
                      }`}>
                        {formatCurrency(row.amount)}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        {formatPaymentDate(row.resolvedAt)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </>

          )}
        </section>

      </PageWrapper>
    </>
  );
}
