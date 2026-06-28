import { Skeleton } from "@/components/shared/skeleton";

export default function NewOrderLoading() {
  return (
    <div className="flex-1 p-4 space-y-4">
      {/* Stock cards */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>
        </div>
      ))}

      {/* Submit */}
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
}
