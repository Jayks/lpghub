import { Skeleton } from "@/components/shared/skeleton";

export default function DeliverySettingsLoading() {
  return (
    <div className="flex-1 p-4 pb-safe-nav space-y-4">
      <div className="glass-sm rounded-xl px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-52" />
          </div>
          <Skeleton className="h-6 w-11 rounded-full" />
        </div>
      </div>
    </div>
  );
}
