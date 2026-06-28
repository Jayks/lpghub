import { Skeleton } from "@/components/shared/skeleton";

export default function CustomerOrderDetailLoading() {
  return (
    <div className="flex-1 p-4 space-y-4">
      {/* Summary card */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <div className="flex justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
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
        </div>
      </div>

      {/* Timeline */}
      <div className="glass rounded-2xl p-5 space-y-0">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="flex flex-col items-center">
              <Skeleton className="w-8 h-8 rounded-full shrink-0" />
              {i < 5 && <div className="w-0.5 h-10 bg-slate-200 dark:bg-slate-700 my-1" />}
            </div>
            <div className="pb-6 space-y-1.5 flex-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* Pay CTA */}
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
}
