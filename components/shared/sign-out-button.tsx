"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { signOutAction } from "@/app/actions/auth";

interface SignOutButtonProps {
  variant?: "icon" | "full";
  className?: string;
}

export function SignOutButton({ variant = "full", className = "" }: SignOutButtonProps) {
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
        className={`flex items-center justify-center w-11 h-11 sm:w-9 sm:h-9 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50 ${className}`}
      >
        <LogOut size={18} />
      </button>
    );
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={pending}
      className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50 ${className}`}
    >
      <LogOut size={16} className="shrink-0" />
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
