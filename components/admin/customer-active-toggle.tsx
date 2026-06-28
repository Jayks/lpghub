"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { toggleCustomerActiveAction } from "@/app/actions/customers";

interface Props {
  id: string;
  isActive: boolean;
}

export function CustomerActiveToggle({ id, isActive }: Props) {
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const res = await toggleCustomerActiveAction(id, !isActive);
      if (!res.ok) toast.error(res.error);
      else toast.success(isActive ? "Customer deactivated" : "Customer activated");
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={pending}
      className={`self-start text-xs px-3 py-1.5 rounded-full font-semibold transition-colors disabled:opacity-60 ${
        isActive
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50"
          : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
      }`}
    >
      {pending ? "Updating…" : isActive ? "Active · tap to deactivate" : "Inactive · tap to activate"}
    </button>
  );
}
