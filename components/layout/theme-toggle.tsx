"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

interface ThemeToggleProps {
  className?: string;
  /** When true (collapsed sidebar) hide the text label */
  collapsed?: boolean;
}

export function ThemeToggle({ className, collapsed = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className={cn(
          "rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse",
          collapsed ? "w-10 h-10" : "h-11 w-full"
        )}
      />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "flex items-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px]",
        collapsed ? "justify-center min-w-[40px] px-0 py-2.5" : "px-3 py-2.5",
        className
      )}
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.span
            className="overflow-hidden whitespace-nowrap text-xs text-slate-400 dark:text-slate-500 hidden md:inline"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.12 }}
          >
            {isDark ? "Light mode" : "Dark mode"}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
