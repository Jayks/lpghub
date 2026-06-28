import { Skeleton, FormSkeleton } from "@/components/shared/skeleton";

export default function AdminSettingsLoading() {
  return (
    <div className="flex-1 p-4 pb-safe-nav space-y-6">
      <FormSkeleton fields={5} />

      <section className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <div className="glass-sm rounded-xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
        </div>
      </section>
    </div>
  );
}
