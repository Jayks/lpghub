import { Skeleton, RowSkeleton } from "@/components/shared/skeleton";

export default function CustomerHomeLoading() {
  return (
    <div className="flex-1 p-4 space-y-4">
      {/* Greeting */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* CTA button */}
      <Skeleton className="h-14 w-full rounded-2xl" />

      {/* Recent orders */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-28 mb-1" />
        {Array.from({ length: 3 }).map((_, i) => (
          <RowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
