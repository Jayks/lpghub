import { Skeleton, CardSkeleton, RowSkeleton } from "@/components/shared/skeleton";

export default function CustomerDetailLoading() {
  return (
    <div className="flex-1 p-4 space-y-4">
      {/* Customer info card */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Caution deposit */}
      <CardSkeleton rows={3} />

      {/* Orders */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-28 mb-1" />
        {Array.from({ length: 4 }).map((_, i) => (
          <RowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
