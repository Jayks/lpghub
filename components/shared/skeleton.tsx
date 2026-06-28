import type React from "react";
import { cn } from "@/lib/utils/cn";

/** A single shimmer block — use for any shape */
export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-slate-200/80 dark:bg-slate-700/60",
        className
      )}
      style={style}
    />
  );
}

/** Full-width card skeleton */
export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="glass rounded-2xl p-5 space-y-3">
      <Skeleton className="h-5 w-1/3" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" style={{ width: `${80 - i * 10}%` }} />
      ))}
    </div>
  );
}

/** List row skeleton */
export function RowSkeleton() {
  return (
    <div className="glass-sm rounded-xl px-4 py-3 flex items-center gap-3">
      <Skeleton className="w-9 h-9 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-28" />
      </div>
      <Skeleton className="h-4 w-16 shrink-0" />
    </div>
  );
}

/** A section heading + N rows */
export function ListSectionSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-3 w-24 mb-3" />
      {Array.from({ length: rows }).map((_, i) => (
        <RowSkeleton key={i} />
      ))}
    </div>
  );
}

/** Form-like skeleton */
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="glass rounded-2xl p-5 space-y-5">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      ))}
      <Skeleton className="h-11 w-full rounded-xl mt-2" />
    </div>
  );
}

/** Stat-card row skeleton (for dashboards) */
export function StatRowSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass-sm rounded-xl p-4 space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-7 w-12" />
        </div>
      ))}
    </div>
  );
}
