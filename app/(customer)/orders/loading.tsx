import { Skeleton, RowSkeleton } from "@/components/shared/skeleton";

export default function CustomerOrdersLoading() {
  return (
    <div className="flex-1 p-4 space-y-2">
      <Skeleton className="h-3 w-28 mb-3" />
      {Array.from({ length: 6 }).map((_, i) => (
        <RowSkeleton key={i} />
      ))}
    </div>
  );
}
