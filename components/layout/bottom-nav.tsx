"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  CreditCard,
  Truck,
  Settings,
} from "lucide-react";
import { isNavItemActive } from "@/lib/utils/nav";
import { cn } from "@/lib/utils/cn";

// ─── Nav config per persona ───────────────────────────────────────────────────

const ADMIN_TABS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
];

const CUSTOMER_TABS = [
  { href: "/", label: "Home", icon: LayoutDashboard, exact: true },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/settings", label: "Settings", icon: Settings },
];

const DELIVERY_TABS = [
  { href: "/delivery", label: "Deliveries", icon: Truck, exact: true },
  { href: "/delivery/settings", label: "Settings", icon: Settings },
];

type Tab = { href: string; label: string; icon: React.ElementType; exact?: boolean };

function getTabs(pathname: string): Tab[] {
  if (pathname.startsWith("/admin")) return ADMIN_TABS;
  if (pathname.startsWith("/delivery")) return DELIVERY_TABS;
  return CUSTOMER_TABS;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BottomNav() {
  const pathname = usePathname();
  const tabs = getTabs(pathname);

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-nav border-t border-slate-200/60 dark:border-slate-700/60"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center h-16 px-2 relative">
        {tabs.map((tab) => {
          const active = isNavItemActive(pathname, tab.href, tab.exact);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 h-full relative z-10 min-h-[44px]"
            >
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-x-1 inset-y-1 rounded-xl bg-cyan-50 dark:bg-cyan-950/60"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <Icon
                className={cn(
                  "w-5 h-5 relative z-10 transition-colors",
                  active
                    ? "text-cyan-600 dark:text-cyan-400"
                    : "text-slate-400 dark:text-slate-500"
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium relative z-10 transition-colors",
                  active
                    ? "text-cyan-600 dark:text-cyan-400"
                    : "text-slate-400 dark:text-slate-500"
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
