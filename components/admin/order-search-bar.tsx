"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useRef } from "react";
import { Search, X, CalendarDays } from "lucide-react";

interface Props {
  initialQ?: string;
  initialFrom?: string;
  initialTo?: string;
}

export function OrderSearchBar({ initialQ = "", initialFrom = "", initialTo = "" }: Props) {
  const router   = useRouter();
  const pathname = usePathname();
  const params   = useSearchParams();

  const [searchValue, setSearchValue] = useState(initialQ);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function buildParams(overrides: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(overrides)) {
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
    }
    return next;
  }

  function handleSearchChange(value: string) {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      router.push(`${pathname}?${buildParams({ q: value.trim() })}`);
    }, 400);
  }

  function handleDateChange(key: "from" | "to", value: string) {
    router.push(`${pathname}?${buildParams({ [key]: value })}`);
  }

  function handleClear() {
    setSearchValue("");
    const next = new URLSearchParams(params.toString());
    next.delete("q");
    next.delete("from");
    next.delete("to");
    router.push(`${pathname}?${next.toString()}`);
  }

  const hasActiveSearch = !!initialQ || !!initialFrom || !!initialTo;

  return (
    <div className="space-y-2">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="search"
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search by order # or customer name…"
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400 transition-colors"
        />
      </div>

      {/* Date range + clear */}
      <div className="flex items-center gap-2">
        {/* From */}
        <div className="relative flex-1">
          <CalendarDays className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="date"
            value={initialFrom}
            onChange={(e) => handleDateChange("from", e.target.value)}
            className="w-full pl-8 pr-2 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400 transition-colors"
          />
        </div>

        <span className="text-xs text-slate-400 shrink-0">to</span>

        {/* To */}
        <div className="relative flex-1">
          <CalendarDays className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="date"
            value={initialTo}
            onChange={(e) => handleDateChange("to", e.target.value)}
            className="w-full pl-8 pr-2 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400 transition-colors"
          />
        </div>

        {/* Clear button — only when a search/date filter is active */}
        {hasActiveSearch && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
