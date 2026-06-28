"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { signOutAction } from "@/app/actions/auth";

interface SignOutButtonProps {
  variant?: "icon" | "full";
  className?: string;
  /** When true (collapsed sidebar) show icon only */
  collapsed?: boolean;
}

export function SignOutButton({ variant = "full", className = "", collapsed = false }: SignOutButtonProps) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSignOut() {
    startTransition(async () => {
      await signOutAction();
      toast.success("Signed out successfully");
      router.push("/login");
    });
  }

  if (variant === "icon") {
    return (
      <button
        onClick={handleSignOut}
        disabled={pending}
        aria-label="Sign out"
        className={cn(
          "flex items-center justify-center w-11 h-11 sm:w-9 sm:h-9 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50",
          className
        )}
      >
        <LogOut size={18} />
      </button>
    );
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={pending}
      className={cn(
        "flex items-center rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50 min-h-[44px] w-full",
        collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5 gap-2.5",
        className
      )}
      title={collapsed ? (pending ? "Signing out…" : "Sign out") : undefined}
    >
      <LogOut size={16} className="shrink-0" />
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.span
            className="overflow-hidden whitespace-nowrap"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.12 }}
          >
            {pending ? "Signing out…" : "Sign out"}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
