import { Skeleton } from "@/components/shared/skeleton";

export default function AdminPaymentsLoading() {
  return (
    <div className="flex-1 p-4 space-y-6">

      {/* Pending Confirmation */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl p-5 space-y-4">
            <div className="flex justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-7 w-20" />
            </div>
            <div className="rounded-xl px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <Skeleton className="h-3 w-36 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-10 flex-1 rounded-xl" />
              <Skeleton className="h-10 flex-1 rounded-xl" />
            </div>
          </div>
        ))}
      </section>

      {/* Awaiting Payment */}
      <section className="space-y-2">
        <Skeleton className="h-3 w-48 mb-1" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-sm rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-4 w-16 shrink-0" />
          </div>
        ))}
      </section>

      {/* Payment History */}
      <section className="space-y-3">
        <Skeleton className="h-3 w-32" />
        <div className="glass rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="w-4 h-4 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="text-right space-y-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-10" />
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
