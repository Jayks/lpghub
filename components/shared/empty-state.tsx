import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "glass-sm rounded-2xl text-center",
        compact ? "px-6 py-8 space-y-3" : "px-6 py-12 space-y-4",
        className
      )}
    >
      {/* Icon in a gradient bubble */}
      <div
        className={cn(
          "rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700/80 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center mx-auto shadow-inner",
          compact ? "w-14 h-14" : "w-18 h-18"
        )}
        style={{ width: compact ? "3.5rem" : "4.5rem", height: compact ? "3.5rem" : "4.5rem" }}
      >
        <Icon
          className={cn(
            "text-slate-400 dark:text-slate-500",
            compact ? "w-7 h-7" : "w-9 h-9"
          )}
        />
      </div>

      {/* Text */}
      <div className="space-y-1">
        <p className="font-semibold text-slate-700 dark:text-slate-200">{title}</p>
        {description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            {description}
          </p>
        )}
      </div>

      {action && <div>{action}</div>}
    </div>
  );
}
