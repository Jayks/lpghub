"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Users,
  Package,
  ShoppingCart,
  CreditCard,
  Truck,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { isNavItemActive } from "@/lib/utils/nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SignOutButton } from "@/components/shared/sign-out-button";
import { cn } from "@/lib/utils/cn";

// ─── Nav item definitions per persona ────────────────────────────────────────

const ADMIN_NAV = [
  { href: "/admin",            label: "Home",      icon: Home,            exact: true },
  { href: "/admin/customers",  label: "Customers", icon: Users },
  { href: "/admin/inventory",  label: "Inventory", icon: Package },
  { href: "/admin/orders",     label: "Orders",    icon: ShoppingCart },
  { href: "/admin/payments",   label: "Payments",   icon: CreditCard, badge: true },
  { href: "/admin/deliveries", label: "Deliveries", icon: Truck,      deliveryBadge: true },
  { href: "/admin/settings",   label: "Settings",  icon: Settings },
];

const CUSTOMER_NAV = [
  { href: "/",         label: "Home",      icon: Home,         exact: true },
  { href: "/orders",   label: "My Orders", icon: ShoppingCart },
  { href: "/settings", label: "Settings",  icon: Settings },
];

const DELIVERY_NAV = [
  { href: "/delivery",          label: "My Deliveries", icon: Truck,    exact: true },
  { href: "/delivery/settings", label: "Settings",      icon: Settings },
];

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  badge?: boolean;         // uses urgentCount (payments)
  deliveryBadge?: boolean; // uses deliveryUrgentCount
};

function getNavItems(pathname: string): NavItem[] {
  if (pathname.startsWith("/admin"))    return ADMIN_NAV;
  if (pathname.startsWith("/delivery")) return DELIVERY_NAV;
  return CUSTOMER_NAV;
}

function getHomeHref(pathname: string): string {
  if (pathname.startsWith("/admin"))    return "/admin";
  if (pathname.startsWith("/delivery")) return "/delivery";
  return "/";
}

// ─── Sidebar component ────────────────────────────────────────────────────────

interface SidebarProps {
  urgentCount?: number;
  deliveryUrgentCount?: number;
}

export function Sidebar({ urgentCount = 0, deliveryUrgentCount = 0 }: SidebarProps) {
  const pathname  = usePathname();
  const navItems  = getNavItems(pathname);
  const homeHref  = getHomeHref(pathname);

  // Collapse state — persisted in localStorage
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("lpghub-sidebar-collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  function toggleCollapse() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("lpghub-sidebar-collapsed", String(next));
      return next;
    });
  }

  return (
    <motion.aside
      className="hidden md:flex flex-col min-h-screen glass-nav border-r border-slate-200/60 dark:border-slate-700/60 shrink-0 overflow-hidden"
      animate={{ width: collapsed ? "4rem" : "14rem" }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
    >
      {/* Logo row */}
      <div className="flex items-center h-14 border-b border-slate-200/60 dark:border-slate-700/60 shrink-0 overflow-hidden">
        {collapsed ? (
          /* Collapsed: logo stays visible + subtle expand icon beside it */
          <div className="flex items-center justify-between w-full px-2 h-full">
            <Link
              href={homeHref}
              title="Home"
              className="flex items-center min-h-[44px]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon.svg" alt="LPGHub" className="w-7 h-7 rounded-lg" />
            </Link>
            <button
              onClick={toggleCollapse}
              title="Expand sidebar"
              className="p-1 rounded-md text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <PanelLeftOpen className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* Expanded: logo link + subtle collapse icon to its right */
          <>
            <Link
              href={homeHref}
              className="flex-1 flex items-center gap-2.5 px-4 min-h-[44px] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors overflow-hidden"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon.svg" alt="LPGHub" className="w-7 h-7 rounded-lg shrink-0" />
              <span
                className="font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap"
                style={{ fontFamily: "var(--font-display)" }}
              >
                LPGHub
              </span>
            </Link>
            <button
              onClick={toggleCollapse}
              title="Collapse sidebar"
              className="mr-2 p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Nav links */}
      <nav className={cn("flex-1 py-3 space-y-0.5", collapsed ? "px-2" : "px-3")}>
        {navItems.map((item) => {
          const active        = isNavItemActive(pathname, item.href, item.exact);
          const Icon          = item.icon;
          const showBadge     = item.badge && urgentCount > 0;
          const showDelBadge  = item.deliveryBadge && deliveryUrgentCount > 0;
          const badgeCount    = showBadge ? urgentCount : showDelBadge ? deliveryUrgentCount : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl text-sm font-medium transition-colors min-h-[44px] relative",
                collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5",
                active
                  ? "bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-400"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              <span className="relative shrink-0">
                <Icon className="w-4 h-4" />
                {(showBadge || showDelBadge) && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </span>
                )}
              </span>
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.span
                    className="overflow-hidden whitespace-nowrap"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.12 }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Footer: theme + sign-out */}
      <div
        className={cn(
          "border-t border-slate-200/60 dark:border-slate-700/60 pt-3 pb-4 space-y-0.5",
          collapsed ? "px-2" : "px-3"
        )}
      >
        <ThemeToggle
          className={cn(
            "w-full text-sm font-medium text-slate-600 dark:text-slate-400",
            collapsed ? "justify-center px-0" : "justify-start gap-2.5 px-3"
          )}
          collapsed={collapsed}
        />
        <SignOutButton collapsed={collapsed} />
      </div>
    </motion.aside>
  );
}
