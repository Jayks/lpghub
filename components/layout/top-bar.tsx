"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SignOutButton } from "@/components/shared/sign-out-button";
import { cn } from "@/lib/utils/cn";

interface TopBarProps {
  title: string;
  backHref?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function TopBar({ title, backHref, actions, className }: TopBarProps) {
  const router = useRouter();

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex items-center gap-3 px-4 h-14 backdrop-blur-sm border-b border-slate-200/60 dark:border-slate-700/60",
        className
      )}
    >
      {backHref && (
        <button
          onClick={() => router.push(backHref)}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}
      <h1 className="flex-1 text-base font-semibold text-slate-800 dark:text-slate-100 truncate">
        {title}
      </h1>
      <div className="flex items-center gap-1">
        {actions}
        {/* Always visible on mobile; hidden on desktop where sidebar has its own toggle */}
        <div className="md:hidden flex items-center gap-1">
          <ThemeToggle />
          <SignOutButton variant="icon" />
        </div>
      </div>
    </header>
  );
}
