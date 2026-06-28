"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  CreditCard,
  Truck,
  Settings,
  Flame,
} from "lucide-react";
import { isNavItemActive } from "@/lib/utils/nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SignOutButton } from "@/components/shared/sign-out-button";
import { cn } from "@/lib/utils/cn";

// ─── Nav item definitions per persona ────────────────────────────────────────

const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/inventory", label: "Inventory", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/deliveries", label: "Deliveries", icon: Truck },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const CUSTOMER_NAV = [
  { href: "/", label: "Home", icon: LayoutDashboard, exact: true },
  { href: "/orders", label: "My Orders", icon: ShoppingCart },
];

const DELIVERY_NAV = [
  { href: "/delivery", label: "My Deliveries", icon: Truck, exact: true },
];

type NavItem = { href: string; label: string; icon: React.ElementType; exact?: boolean };

function getNavItems(pathname: string): NavItem[] {
  if (pathname.startsWith("/admin")) return ADMIN_NAV;
  if (pathname.startsWith("/delivery")) return DELIVERY_NAV;
  return CUSTOMER_NAV;
}

// ─── Sidebar component ────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const navItems = getNavItems(pathname);

  return (
    <aside className="hidden md:flex flex-col w-56 min-h-screen glass-nav border-r border-slate-200/60 dark:border-slate-700/60 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-14 border-b border-slate-200/60 dark:border-slate-700/60">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
          <Flame className="w-4 h-4 text-white" />
        </div>
        <span
          className="font-bold text-slate-800 dark:text-slate-100"
          style={{ fontFamily: "var(--font-display)" }}
        >
          LPGHub
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {navItems.map((item) => {
          const active = isNavItemActive(pathname, item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors min-h-[44px]",
                active
                  ? "bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-400"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: theme toggle + sign out */}
      <div className="px-3 pb-4 border-t border-slate-200/60 dark:border-slate-700/60 pt-3 space-y-0.5">
        <ThemeToggle className="w-full justify-start gap-3 px-3 text-sm font-medium text-slate-600 dark:text-slate-400" />
        <SignOutButton />
      </div>
    </aside>
  );
}
