import { cn } from "@/lib/utils/cn";

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
}

export function LoadingSkeleton({ className, lines = 3 }: LoadingSkeletonProps) {
  return (
    <div className={cn("space-y-3 animate-pulse", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-4 rounded-md bg-slate-200 dark:bg-slate-700",
            i === lines - 1 && "w-3/4"
          )}
        />
      ))}
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "glass rounded-2xl p-6 space-y-4 animate-pulse",
        className
      )}
    >
      <div className="h-5 w-1/3 rounded-md bg-slate-200 dark:bg-slate-700" />
      <div className="h-8 w-1/2 rounded-md bg-slate-200 dark:bg-slate-700" />
      <div className="h-4 w-2/3 rounded-md bg-slate-200 dark:bg-slate-700" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {/* Header */}
      <div className="flex gap-4 px-4 py-2">
        {[40, 25, 20, 15].map((w, i) => (
          <div
            key={i}
            className="h-3 rounded bg-slate-200 dark:bg-slate-700"
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 px-4 py-3 rounded-xl bg-white/40 dark:bg-slate-800/40"
        >
          {[40, 25, 20, 15].map((w, j) => (
            <div
              key={j}
              className="h-4 rounded bg-slate-200 dark:bg-slate-700"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
