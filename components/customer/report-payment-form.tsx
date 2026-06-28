"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { reportPaymentAction } from "@/app/actions/payments";

interface Props {
  orderId: string;
  alreadyReported: boolean;
}

export function ReportPaymentForm({ orderId, alreadyReported }: Props) {
  const router = useRouter();
  const [ref, setRef] = useState("");
  const [pending, startTransition] = useTransition();

  if (alreadyReported) {
    return (
      <div className="glass-sm rounded-2xl p-4 text-center space-y-1">
        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
        <p className="text-sm font-bold text-slate-900 dark:text-slate-50">
          Payment reported
        </p>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          We'll confirm your payment shortly
        </p>
      </div>
    );
  }

  const handleSubmit = () => {
    startTransition(async () => {
      const res = await reportPaymentAction(orderId, ref.trim() || null);
      if (res.ok) {
        toast.success("Payment reported — awaiting admin confirmation");
        router.push("/orders");
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="glass-sm rounded-2xl p-4 space-y-3">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Tap below once you have completed the payment.
      </p>
      <div className="space-y-1">
        <input
          type="text"
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
          placeholder="UPI transaction ID (optional)"
          disabled={pending}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
        />
        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 px-1">
          You can leave this blank — your admin can fill it in while confirming.
        </p>
      </div>
      <button
        onClick={handleSubmit}
        disabled={pending}
        className="w-full py-3 rounded-xl font-bold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
      >
        {pending ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <CheckCircle2 className="w-5 h-5" />
        )}
        I have paid
      </button>
    </div>
  );
}
