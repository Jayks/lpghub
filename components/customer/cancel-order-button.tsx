"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cancelOrderAction } from "@/app/actions/orders";

interface Props {
  orderId: string;
}

export function CancelOrderButton({ orderId }: Props) {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleFirstTap() {
    setConfirmed(true);
  }

  function handleConfirm() {
    startTransition(async () => {
      const res = await cancelOrderAction(orderId);
      if (res.ok) {
        toast.success("Order cancelled");
        router.push("/orders");
        router.refresh();
      } else {
        toast.error(res.error);
        setConfirmed(false);
      }
    });
  }

  if (!confirmed) {
    return (
      <button
        onClick={handleFirstTap}
        className="w-full py-3 rounded-2xl text-sm font-semibold text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700/50 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2"
      >
        <XCircle className="w-4 h-4" />
        Cancel Order
      </button>
    );
  }

  return (
    <div className="glass-sm rounded-2xl p-4 space-y-3">
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 text-center">
        Cancel this order?
      </p>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 text-center">
        Stock will be restored. This cannot be undone.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => setConfirmed(false)}
          disabled={pending}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 transition-colors"
        >
          Keep Order
        </button>
        <button
          onClick={handleConfirm}
          disabled={pending}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5"
        >
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
          Yes, Cancel
        </button>
      </div>
    </div>
  );
}
