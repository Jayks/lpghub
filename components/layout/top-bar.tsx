"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, ChevronRight, Package, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SignOutButton } from "@/components/shared/sign-out-button";
import { cn } from "@/lib/utils/cn";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface TopBarProps {
  title?: string;
  backHref?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

export function TopBar({ title, backHref, breadcrumbs, actions, className }: TopBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  // Auto-derive back href from breadcrumbs if not explicitly provided
  const resolvedBackHref =
    backHref ??
    (breadcrumbs && breadcrumbs.length >= 2
      ? breadcrumbs[breadcrumbs.length - 2].href
      : undefined);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-4 h-14 glass-nav border-b border-slate-200/60 dark:border-slate-700/60",
        "md:sticky md:left-auto md:right-auto",
        className
      )}
    >
      {resolvedBackHref && (
        <button
          onClick={() => router.push(resolvedBackHref)}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}

      <div className="flex-1 min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav aria-label="Breadcrumb" className="flex items-center gap-0.5 overflow-hidden">
            {breadcrumbs.map((item, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <span key={i} className="flex items-center gap-0.5 min-w-0">
                  {i > 0 && (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
                  )}
                  {isLast ? (
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {item.label}
                    </span>
                  ) : item.href ? (
                    <Link
                      href={item.href}
                      className="text-sm font-medium text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors truncate shrink-0"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-sm font-medium text-slate-400 dark:text-slate-500 truncate shrink-0">
                      {item.label}
                    </span>
                  )}
                </span>
              );
            })}
          </nav>
        ) : (
          <h1 className="text-base font-semibold text-slate-800 dark:text-slate-100 truncate">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-1">
        {actions}
        {/* Mobile-only top nav icons */}
        <div className="md:hidden flex items-center gap-0.5">
          {isAdmin && (
            <>
              <Link
                href="/admin/inventory"
                aria-label="Inventory"
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-xl transition-colors",
                  pathname.startsWith("/admin/inventory")
                    ? "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                <Package className="w-[18px] h-[18px]" />
              </Link>
              <Link
                href="/admin/settings"
                aria-label="Settings"
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-xl transition-colors",
                  pathname.startsWith("/admin/settings")
                    ? "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                <Settings className="w-[18px] h-[18px]" />
              </Link>
            </>
          )}
          <ThemeToggle collapsed />
          <SignOutButton variant="icon" />
        </div>
      </div>
    </header>
  );
}
