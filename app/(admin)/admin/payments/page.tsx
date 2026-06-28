import type { Metadata } from "next";
import { TopBar } from "@/components/layout/top-bar";
import { Clock } from "lucide-react";
import { getPendingPayments } from "@/lib/db/queries/payments";
import { PaymentActionButtons } from "@/components/admin/payment-action-buttons";
import { formatRelative } from "@/lib/utils/format-date";
import { formatOrderNumber } from "@/lib/utils/format-order-number";

export const metadata: Metadata = { title: "Payments" };

export default async function AdminPaymentsPage() {
  const pending = await getPendingPayments();

  return (
    <>
      <TopBar title="Payments" />
      <div className="flex-1 p-4 space-y-4">

        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Pending Confirmation
          </h2>
          <span className="text-xs px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 font-semibold">
            {pending.length} pending
          </span>
        </div>

        {pending.length === 0 && (
          <div className="glass rounded-2xl p-8 text-center text-slate-500 dark:text-slate-400 text-sm font-medium">
            No payments awaiting confirmation
          </div>
        )}

        <div className="space-y-3">
          {pending.map((item) => (
            <div key={item.paymentId} className="glass rounded-2xl p-5 space-y-4">

              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 dark:text-slate-50 truncate">
                    {item.businessName}
                  </p>
                  <p className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                    {formatOrderNumber(item.orderNumber)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {item.phone} · {item.createdAt ? formatRelative(item.createdAt) : "—"}
                  </p>
                </div>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-50 tabular-nums shrink-0">
                  ₹{Number(item.amount).toLocaleString("en-IN")}
                </p>
              </div>

              {/* UPI ref */}
              <div className="rounded-xl px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Customer-reported UPI ref
                </p>
                <p className="text-sm font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {item.paymentRef ?? <span className="italic font-normal text-slate-400">Not provided</span>}
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
      </div>
    </>
  );
}
