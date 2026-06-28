import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AnimatedOrbs } from "@/components/auth/animated-orbs";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 relative overflow-y-auto">
      {/* Orbs in a fixed layer so overflow-hidden is scoped away from the scroll container */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <AnimatedOrbs />
      </div>

      {/* Theme toggle — pinned top-right, above form content */}
      <div className="fixed top-3 right-3 z-20 glass-sm rounded-xl">
        <ThemeToggle collapsed />
      </div>

      <div className="relative z-10 w-full flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
