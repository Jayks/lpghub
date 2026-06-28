import type { Metadata } from "next";
import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { PageWrapper } from "@/components/shared/page-wrapper";
import { getAdminStats } from "@/lib/db/queries/admin-stats";
import { computeInventoryBar } from "@/lib/inventory/bar";
import { formatCurrency } from "@/lib/utils/format-currency";
import {
  CreditCard,
  Package,
  Users,
  Truck,
  Clock,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  ShoppingCart,
  IndianRupee,
  Bell,
  CalendarDays,
  BarChart3,
} from "lucide-react";

export const metadata: Metadata = { title: "Admin Dashboard" };

// ─── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  title,
  icon: Icon,
  stripe,
  containerCls,
  headerCls,
  children,
}: {
  title: string;
  icon: React.ElementType;
  stripe: string;
  containerCls: string;
  headerCls: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl overflow-hidden border ${containerCls} flex`}>
      <div className={`w-1.5 shrink-0 ${stripe}`} />
      <div className="flex-1 min-w-0">
        <div className={`flex items-center gap-3 px-4 py-3 border-b ${headerCls}`}>
          <Icon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <h2 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">
            {title}
          </h2>
        </div>
        <div className="p-3">{children}</div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminHomePage() {
  const stats = await getAdminStats();

  const TrendIcon =
    stats.revenueTrend === null ? Minus
    : stats.revenueTrend >= 0   ? TrendingUp
    : TrendingDown;

  const trendColor =
    stats.revenueTrend === null ? "text-slate-400"
    : stats.revenueTrend >= 0   ? "text-emerald-600 dark:text-emerald-400"
    : "text-red-500 dark:text-red-400";

  return (
    <>
      <TopBar title="Home" />
      <PageWrapper className="flex-1 p-4 space-y-4">

        {/* ── NEEDS ATTENTION ──────────────────────────────────────────────── */}
        <Section
          title="Needs Attention"
          icon={Bell}
          stripe="bg-amber-500"
          containerCls="bg-amber-50 border-amber-200/70 dark:bg-amber-950/30 dark:border-amber-800/40"
          headerCls="bg-amber-100/70 border-amber-200/60 dark:bg-amber-900/30 dark:border-amber-800/40"
        >
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Payments to Confirm",      count: stats.pendingPayments,      icon: CreditCard, href: "/admin/payments",   urgent: true  },
                { label: "Awaiting Assignment",       count: stats.awaitingAssignment,   icon: Truck,      href: "/admin/deliveries",  urgent: true  },
                { label: "Awaiting Customer Payment", count: stats.pendingPaymentOrders, icon: Clock,      href: "/admin/orders",      urgent: false },
                { label: "Active Deliveries",         count: stats.activeDeliveries,     icon: Package,    href: "/admin/deliveries",  urgent: false },
              ].map(({ label, count, icon: Icon, href, urgent }) => (
                <Link
                  key={label}
                  href={href}
                  className={[
                    "flex items-center gap-3 p-3 rounded-xl border transition-colors active:scale-[0.97]",
                    count > 0 && urgent
                      ? "bg-white dark:bg-slate-800 border-amber-300 dark:border-amber-700/50 shadow-sm hover:border-amber-400"
                      : "bg-white/70 dark:bg-slate-800/60 border-amber-200/50 dark:border-slate-700/50 hover:border-amber-300",
                  ].join(" ")}
                >
                  <div className={[
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                    count > 0 && urgent
                      ? "bg-amber-100 dark:bg-amber-900/50"
                      : "bg-slate-100 dark:bg-slate-700/60",
                  ].join(" ")}>
                    <Icon className={[
                      "w-4 h-4",
                      count > 0 && urgent
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-slate-400 dark:text-slate-500",
                    ].join(" ")} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums leading-none">
                      {count}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                      {label}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {stats.lowStockItems.map((item) => (
              <Link
                key={item.label}
                href="/admin/inventory"
                className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-xs text-red-700 dark:text-red-400">
                  <span className="font-semibold">{item.label}</span> stock low —{" "}
                  only <span className="font-semibold">{item.availableStock}</span> available
                </p>
              </Link>
            ))}
          </div>
        </Section>

        {/* ── TODAY ────────────────────────────────────────────────────────── */}
        <Section
          title="Today"
          icon={CalendarDays}
          stripe="bg-cyan-500"
          containerCls="bg-sky-50 border-sky-200/60 dark:bg-sky-950/25 dark:border-sky-800/40"
          headerCls="bg-sky-100/70 border-sky-200/60 dark:bg-sky-900/20 dark:border-sky-800/40"
        >
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Delivered",        value: stats.deliveredToday,                      icon: CheckCircle2, href: "/admin/orders",    color: "text-emerald-600 dark:text-emerald-400", iconBg: "bg-emerald-100 dark:bg-emerald-900/40" },
              { label: "Revenue",          value: formatCurrency(stats.revenueToday, "INR"), icon: IndianRupee,  href: "/admin/orders",    color: "text-cyan-600 dark:text-cyan-400",       iconBg: "bg-cyan-100 dark:bg-cyan-900/40"       },
              { label: "Active Customers", value: stats.activeCustomers,                      icon: Users,        href: "/admin/customers", color: "text-blue-600 dark:text-blue-400",       iconBg: "bg-blue-100 dark:bg-blue-900/40"       },
              { label: "Total Orders",     value: stats.totalOrders,                          icon: ShoppingCart, href: "/admin/orders",    color: "text-violet-600 dark:text-violet-400",   iconBg: "bg-violet-100 dark:bg-violet-900/40"   },
            ].map(({ label, value, icon: Icon, href, color, iconBg }) => (
              <Link
                key={label}
                href={href}
                className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-sky-200/60 dark:border-slate-700/50 hover:border-sky-300 shadow-sm transition-colors active:scale-[0.97]"
              >
                <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-none mb-1">{label}</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums leading-none truncate">
                    {value}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Section>

        {/* ── THIS MONTH ───────────────────────────────────────────────────── */}
        <Section
          title="This Month"
          icon={BarChart3}
          stripe="bg-violet-500"
          containerCls="bg-violet-50 border-violet-200/60 dark:bg-violet-950/25 dark:border-violet-800/40"
          headerCls="bg-violet-100/70 border-violet-200/60 dark:bg-violet-900/20 dark:border-violet-800/40"
        >
          <div className="space-y-2">
            <Link
              href="/admin/orders"
              className="flex items-start justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-violet-200/60 dark:border-slate-700/50 hover:border-violet-300 shadow-sm transition-colors active:scale-[0.98] block"
            >
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Revenue</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums leading-none">
                  {formatCurrency(stats.revenueThisMonth, "INR")}
                </p>
                {stats.pendingRevenue > 0 && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5 font-medium">
                    + {formatCurrency(stats.pendingRevenue, "INR")} pending
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">Last month</p>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 tabular-nums">
                  {formatCurrency(stats.revenueLastMonth, "INR")}
                </p>
                <div className={`flex items-center justify-end gap-1 mt-1 ${trendColor}`}>
                  <TrendIcon className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold">
                    {stats.revenueTrend === null ? "—" : `${Math.abs(stats.revenueTrend)}%`}
                  </span>
                </div>
              </div>
            </Link>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Orders",        value: stats.ordersThisMonth,       href: "/admin/orders",    color: "text-violet-600 dark:text-violet-400" },
                { label: "New Customers", value: stats.newCustomersThisMonth, href: "/admin/customers", color: "text-cyan-600 dark:text-cyan-400"     },
                { label: "Delivered",     value: stats.deliveredToday,        href: "/admin/orders",    color: "text-emerald-600 dark:text-emerald-400" },
              ].map(({ label, value, href, color }) => (
                <Link
                  key={label}
                  href={href}
                  className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-violet-200/60 dark:border-slate-700/50 hover:border-violet-300 shadow-sm text-center transition-colors active:scale-[0.97]"
                >
                  <p className={`text-2xl font-bold tabular-nums leading-none ${color}`}>{value}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 leading-snug">{label}</p>
                </Link>
              ))}
            </div>
          </div>
        </Section>

        {/* ── INVENTORY ────────────────────────────────────────────────────── */}
        <Section
          title="Inventory"
          icon={Package}
          stripe="bg-blue-500"
          containerCls="bg-blue-50/60 border-blue-200/60 dark:bg-blue-950/25 dark:border-blue-800/40"
          headerCls="bg-blue-100/70 border-blue-200/60 dark:bg-blue-900/20 dark:border-blue-800/40"
        >
          <div className="space-y-2.5">
            {stats.inventoryData.map((cyl) => {
              const bar = computeInventoryBar(
                cyl.totalStock,
                cyl.availableStock,
                cyl.reservedStock,
                cyl.deliveredStock,
              );

              return (
                <Link
                  key={cyl.label}
                  href="/admin/inventory"
                  className="glass-sm rounded-xl p-4 block hover:brightness-[1.03] active:scale-[0.98] transition-all"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{cyl.label}</span>
                    <span className="text-[11px] font-mono font-semibold text-slate-400 dark:text-slate-500 tabular-nums">
                      {cyl.totalStock} total
                    </span>
                  </div>

                  {/* Stat trio */}
                  <div className="grid grid-cols-3 gap-1 mb-3">
                    <div className="text-center rounded-lg py-2"
                      style={{ background: "rgba(59,130,246,0.08)" }}>
                      <p className="text-xl font-bold tabular-nums leading-none"
                        style={{ color: "#3B82F6" }}>
                        {cyl.availableStock}
                      </p>
                      <p className="text-[9px] font-semibold uppercase tracking-wide mt-1"
                        style={{ color: "#60A5FA" }}>
                        Available
                      </p>
                    </div>
                    <div className="text-center rounded-lg py-2"
                      style={{ background: "rgba(245,158,11,0.08)" }}>
                      <p className="text-xl font-bold tabular-nums leading-none text-amber-500 dark:text-amber-400">
                        {cyl.reservedStock}
                      </p>
                      <p className="text-[9px] font-semibold uppercase tracking-wide mt-1 text-amber-400 dark:text-amber-500">
                        Reserved
                      </p>
                    </div>
                    <div className="text-center rounded-lg py-2"
                      style={{ background: "rgba(16,185,129,0.08)" }}>
                      <p className="text-xl font-bold tabular-nums leading-none text-emerald-600 dark:text-emerald-400">
                        {cyl.deliveredStock}
                      </p>
                      <p className="text-[9px] font-semibold uppercase tracking-wide mt-1 text-emerald-500 dark:text-emerald-600">
                        Delivered
                      </p>
                    </div>
                  </div>

                  {/* Segmented gradient bar */}
                  <div className="h-2 rounded-full flex overflow-hidden bg-slate-200/70 dark:bg-slate-700/50">
                    {bar.available.count > 0 && (
                      <div
                        style={{ width: `${bar.available.pct}%`, background: "linear-gradient(90deg,#2563EB,#60A5FA)" }}
                        className="shrink-0"
                      />
                    )}
                    {bar.reserved.count > 0 && (
                      <div
                        style={{ width: `${bar.reserved.pct}%`, minWidth: 4, background: "linear-gradient(90deg,#F59E0B,#FCD34D)" }}
                        className="shrink-0"
                      />
                    )}
                    {bar.delivered.count > 0 && (
                      <div
                        style={{ width: `${bar.delivered.pct}%`, minWidth: 4, background: "linear-gradient(90deg,#10B981,#34D399)" }}
                        className="shrink-0"
                      />
                    )}
                    {bar.total === 0 && <div className="flex-1 bg-slate-200 dark:bg-slate-700" />}
                  </div>
                </Link>
              );
            })}

            {/* Legend */}
            <div className="flex items-center justify-center gap-5 pt-1">
              {[
                { color: "#3B82F6", label: "Available"  },
                { color: "#F59E0B", label: "Reserved"   },
                { color: "#10B981", label: "Delivered"  },
              ].map(({ color, label }) => (
                <span key={label} className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </Section>

      </PageWrapper>
    </>
  );
}
