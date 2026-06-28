"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ORDER_FILTER_LABELS } from "@/lib/config/order-filters";
import type { OrderFilterKey } from "@/lib/config/order-filters";

const FILTERS = Object.entries(ORDER_FILTER_LABELS) as [OrderFilterKey, string][];

interface Props {
  active: OrderFilterKey;
}

export function OrderFilterPills({ active }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function select(key: OrderFilterKey) {
    const params = new URLSearchParams(searchParams.toString());
    if (key === "all") {
      params.delete("filter");
    } else {
      params.set("filter", key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map(([key, label]) => (
        <button
          key={key}
          onClick={() => select(key)}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
            active === key
              ? "bg-cyan-600 text-white"
              : "text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-cyan-400 dark:hover:border-cyan-600"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
