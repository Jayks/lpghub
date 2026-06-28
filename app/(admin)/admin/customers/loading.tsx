import { Skeleton, RowSkeleton } from "@/components/shared/skeleton";

export default function AdminCustomersLoading() {
  return (
    <div className="flex-1 p-4 space-y-2">
      <Skeleton className="h-10 w-full rounded-xl mb-1" />
      {Array.from({ length: 8 }).map((_, i) => (
        <RowSkeleton key={i} />
      ))}
    </div>
  );
}
