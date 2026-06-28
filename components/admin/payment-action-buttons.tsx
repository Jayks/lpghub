"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { confirmPaymentAction, rejectPaymentAction } from "@/app/actions/payments";

interface Props {
  paymentId: string;
  orderId: string;
  /** Existing ref from customer (may be null) */
  existingRef?: string | null;
}

export function PaymentActionButtons({ paymentId, orderId, existingRef }: Props) {
  const [done, setDone]   = useState(false);
  const [ref,  setRef]    = useState(existingRef ?? "");
  const [confirming, startConfirm] = useTransition();
  const [rejecting,  startReject]  = useTransition();

  if (done) {
    return (
      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 text-center py-2">
        Action recorded
      </p>
    );
  }

  const handleConfirm = () => {
    startConfirm(async () => {
      const res = await confirmPaymentAction(paymentId, orderId, ref.trim() || null);
      if (res.ok) {
        toast.success("Payment confirmed — order moved to Confirmed");
        setDone(true);
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleReject = () => {
    startReject(async () => {
      const res = await rejectPaymentAction(paymentId, orderId);
      if (res.ok) {
        toast.success("Payment rejected — inventory restored");
        setDone(true);
      } else {
        toast.error(res.error);
      }
    });
  };

  const busy = confirming || rejecting;

  return (
    <div className="space-y-3">
      {/* Admin can enter / correct the UPI ref before confirming */}
      <div className="space-y-1">
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          UPI Transaction ID
        </label>
        <input
          type="text"
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          placeholder="Enter or verify UPI reference (optional)"
          disabled={busy}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleConfirm}
          disabled={busy}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
        >
          {confirming ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          Confirm
        </button>
        <button
          onClick={handleReject}
          disabled={busy}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700/50 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5"
        >
          {rejecting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <XCircle className="w-4 h-4" />
          )}
          Reject
        </button>
      </div>
    </div>
  );
}
