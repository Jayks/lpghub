import { Skeleton, RowSkeleton } from "@/components/shared/skeleton";

export default function AdminOrdersLoading() {
  return (
    <div className="flex-1 p-4 space-y-4">
      {/* Search + filter */}
      <div className="space-y-2">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-9 w-full rounded-xl" />
      </div>

      {/* Desktop table placeholder */}
      <div className="hidden md:block glass rounded-2xl overflow-hidden">
        <div className="border-b border-slate-200/60 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-800/60 px-4 py-3 grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-16" />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="px-4 py-3 grid grid-cols-5 gap-4 border-b border-slate-100 dark:border-slate-800/60">
            {[75, 90, 60, 50, 65].map((w, j) => (
              <Skeleton key={j} className="h-4" style={{ width: `${w}%` }} />
            ))}
          </div>
        ))}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <RowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
