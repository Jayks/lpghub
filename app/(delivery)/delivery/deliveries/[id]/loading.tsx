import { Skeleton, CardSkeleton } from "@/components/shared/skeleton";

export default function DeliveryDetailLoading() {
  return (
    <div className="flex-1 p-4 space-y-4">
      {/* Order summary */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <div className="flex justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-4 w-36" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>

      {/* Cylinders */}
      <div className="glass-sm rounded-xl px-4 py-3 space-y-2">
        <Skeleton className="h-3 w-20 mb-2" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>

      {/* Customer details */}
      <CardSkeleton rows={3} />

      {/* Action buttons */}
      <div className="flex gap-3">
        <Skeleton className="h-12 flex-1 rounded-xl" />
        <Skeleton className="h-12 flex-1 rounded-xl" />
      </div>
    </div>
  );
}
