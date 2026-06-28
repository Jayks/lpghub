import { Skeleton } from "@/components/shared/skeleton";

export default function AdminInventoryLoading() {
  return (
    <div className="flex-1 p-4 space-y-5">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="glass rounded-2xl p-5 space-y-5">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>

          {/* Big number */}
          <div className="text-center py-1 space-y-2">
            <Skeleton className="h-16 w-20 mx-auto rounded-xl" />
            <Skeleton className="h-3 w-24 mx-auto" />
          </div>

          {/* Secondary stats */}
          <div className="flex divide-x divide-slate-200 dark:divide-slate-700">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex-1 flex flex-col items-center gap-1 px-2">
                <Skeleton className="h-6 w-8" />
                <Skeleton className="h-3 w-14" />
              </div>
            ))}
          </div>

          {/* Adjust form */}
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1 rounded-xl" />
            <Skeleton className="h-10 w-28 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
