import { Skeleton, RowSkeleton } from "@/components/shared/skeleton";

export default function AdminDeliveriesLoading() {
  return (
    <div className="flex-1 p-4 space-y-5">
      {/* Awaiting Assignment */}
      <section className="space-y-2">
        <Skeleton className="h-3 w-40 mb-3" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl p-4 space-y-3">
            <div className="flex justify-between gap-3">
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-28" />
              </div>
              <div className="space-y-1.5 text-right shrink-0">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1 rounded-xl" />
              <Skeleton className="h-10 w-24 rounded-xl" />
            </div>
          </div>
        ))}
      </section>

      {/* In Progress */}
      <section className="space-y-2">
        <Skeleton className="h-3 w-24 mb-3" />
        {Array.from({ length: 2 }).map((_, i) => (
          <RowSkeleton key={i} />
        ))}
      </section>

      {/* Delivery Team */}
      <section className="space-y-2">
        <div className="flex justify-between mb-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-4 w-20" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <RowSkeleton key={i} />
        ))}
      </section>
    </div>
  );
}
