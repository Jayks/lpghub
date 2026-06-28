import { Skeleton, CardSkeleton } from "@/components/shared/skeleton";

export default function AdminOrderDetailLoading() {
  return (
    <div className="flex-1 p-4 space-y-4">
      {/* Order summary */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <div className="flex justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-2 flex justify-between">
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </div>

      {/* Customer + Payment + Delivery */}
      <CardSkeleton rows={3} />
      <CardSkeleton rows={4} />
      <CardSkeleton rows={2} />
    </div>
  );
}
