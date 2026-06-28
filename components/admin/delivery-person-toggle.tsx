"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { toggleDeliveryPersonAction } from "@/app/actions/delivery-persons";

interface Props {
  id: string;
  isActive: boolean;
}

export function DeliveryPersonToggle({ id, isActive }: Props) {
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const res = await toggleDeliveryPersonAction(id, !isActive);
      if (!res.ok) toast.error(res.error);
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={pending}
      className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors disabled:opacity-60 ${
        isActive
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50"
          : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
      }`}
    >
      {isActive ? "Active" : "Inactive"}
    </button>
  );
}
