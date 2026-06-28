import { Skeleton } from "@/components/shared/skeleton";

export default function PaymentLoading() {
  return (
    <div className="flex-1 p-4 space-y-4">
      {/* Summary */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-7 w-20" />
        </div>
        <Skeleton className="h-3 w-40" />
      </div>

      {/* QR + pay button */}
      <div className="glass rounded-2xl p-5 space-y-4 flex flex-col items-center">
        <Skeleton className="w-48 h-48 rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-4 w-32 mx-auto" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>

      {/* Report form */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}
