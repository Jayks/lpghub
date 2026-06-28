import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AnimatedOrbs } from "@/components/auth/animated-orbs";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <AnimatedOrbs />

      {/* Theme toggle — pinned top-right */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {children}
    </div>
  );
}
