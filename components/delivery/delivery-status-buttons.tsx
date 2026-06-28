"use client";

import { useState, useTransition } from "react";
import { Truck, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { markOutForDeliveryAction, markDeliveredAction } from "@/app/actions/deliveries";

interface Props {
  assignmentId: string;
  status: string; // "assigned" | "out_for_delivery" | "delivered"
}

export function DeliveryStatusButtons({ assignmentId, status: initialStatus }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [remarks, setRemarks] = useState("");
  const [dispatching, startDispatch] = useTransition();
  const [delivering, startDeliver] = useTransition();

  if (status === "delivered") {
    return (
      <div className="glass-sm rounded-2xl p-6 text-center space-y-2">
        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
        <p className="font-bold text-slate-900 dark:text-slate-50">Delivered</p>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          This order has been marked as delivered
        </p>
      </div>
    );
  }

  const handleDispatch = () => {
    startDispatch(async () => {
      const res = await markOutForDeliveryAction(assignmentId);
      if (res.ok) {
        toast.success("Marked as Out for Delivery");
        setStatus("out_for_delivery");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleDeliver = () => {
    startDeliver(async () => {
      const res = await markDeliveredAction(assignmentId, remarks);
      if (res.ok) {
        toast.success("Marked as Delivered");
        setStatus("delivered");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="space-y-3">
      {status === "assigned" && (
        <button
          onClick={handleDispatch}
          disabled={dispatching || delivering}
          className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-br from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 disabled:opacity-60 transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          {dispatching ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Truck className="w-5 h-5" />
          )}
          Mark Out for Delivery
        </button>
      )}

      <div className="glass-sm rounded-2xl p-4 space-y-3">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
          Delivery remarks (optional)
        </label>
        <textarea
          rows={3}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="e.g. Left at gate, collected by Ravi…"
          disabled={delivering}
          className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 resize-none"
        />
        <button
          onClick={handleDeliver}
          disabled={dispatching || delivering}
          className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-br from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-60 transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          {delivering ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <CheckCircle2 className="w-5 h-5" />
          )}
          Mark as Delivered
        </button>
      </div>
    </div>
  );
}
