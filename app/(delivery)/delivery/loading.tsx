import { Skeleton, RowSkeleton } from "@/components/shared/skeleton";

export default function DeliveryHomeLoading() {
  return (
    <div className="flex-1 p-4 space-y-4">
      {/* Active deliveries */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-32 mb-3" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl p-4 space-y-3">
            <div className="flex justify-between gap-3">
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-24 rounded-full shrink-0" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1 rounded-xl" />
            </div>
          </div>
        ))}
      </div>

      {/* Completed */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-28 mb-3" />
        {Array.from({ length: 2 }).map((_, i) => (
          <RowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
