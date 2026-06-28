import { Skeleton, StatRowSkeleton, CardSkeleton } from "@/components/shared/skeleton";

export default function AdminDashboardLoading() {
  return (
    <div className="flex-1 p-4 space-y-4">
      {/* Needs Attention */}
      <CardSkeleton rows={3} />

      {/* Today */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <Skeleton className="h-4 w-20" />
        <StatRowSkeleton />
      </div>

      {/* This Month */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <Skeleton className="h-4 w-24" />
        <StatRowSkeleton />
      </div>

      {/* Inventory */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <Skeleton className="h-4 w-20" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-10" />
            </div>
            <Skeleton className="h-3 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
