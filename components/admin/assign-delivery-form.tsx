"use client";

import { useState, useTransition } from "react";
import { UserCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { assignDeliveryAction } from "@/app/actions/deliveries";
import type { DeliveryPersonRow } from "@/lib/db/queries/deliveries";

interface Props {
  orderId: string;
  deliveryPersons: DeliveryPersonRow[];
}

export function AssignDeliveryForm({ orderId, deliveryPersons }: Props) {
  const [selectedId, setSelectedId] = useState("");
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  if (done) {
    return (
      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        ✓ Assigned
      </p>
    );
  }

  const handleAssign = () => {
    if (!selectedId) {
      toast.error("Select a delivery person first");
      return;
    }
    startTransition(async () => {
      const res = await assignDeliveryAction(orderId, selectedId);
      if (res.ok) {
        toast.success("Delivery person assigned");
        setDone(true);
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="flex gap-2">
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        disabled={pending}
        className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
      >
        <option value="">Select delivery person…</option>
        {deliveryPersons.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <button
        onClick={handleAssign}
        disabled={pending}
        className="px-4 py-2 rounded-xl text-sm font-semibold bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-white transition-colors flex items-center gap-1.5 shadow-sm"
      >
        {pending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <UserCheck className="w-4 h-4" />
        )}
        Assign
      </button>
    </div>
  );
}
