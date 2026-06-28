import type { Metadata } from "next";
import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { getAdminStats } from "@/lib/db/queries/admin-stats";
import { ShoppingCart, CreditCard, Package, Users, AlertTriangle } from "lucide-react";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function AdminHomePage() {
  const stats = await getAdminStats();

  const KPI = [
    { label: "Active Customers", value: stats.activeCustomers,    icon: Users,       color: "from-cyan-500 to-blue-500",    href: "/admin/customers" },
    { label: "Pending Payments", value: stats.pendingPayments,    icon: CreditCard,  color: "from-amber-500 to-orange-500", href: "/admin/payments"  },
    { label: "Total Orders",     value: stats.totalOrders,        icon: ShoppingCart,color: "from-teal-500 to-emerald-500", href: "/admin/orders"    },
    { label: "Low Stock Types",  value: stats.lowStockItems.length,icon: Package,    color: "from-red-500 to-rose-500",     href: "/admin/inventory" },
  ];

  return (
    <>
      <TopBar title="Dashboard" />
      <div className="flex-1 p-4 space-y-6">

        {/* KPI row */}
        <div className="grid grid-cols-2 gap-3">
          {KPI.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Link key={kpi.label} href={kpi.href} className="glass rounded-2xl p-4 space-y-2 hover:shadow-md transition-shadow active:scale-[0.98]">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 tabular">{kpi.value}</p>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{kpi.label}</p>
              </Link>
            );
          })}
        </div>

        {/* Low stock alerts */}
        {stats.lowStockItems.length > 0 && (
          <div className="space-y-2">
            {stats.lowStockItems.map((item) => (
              <Link
                key={item.label}
                href="/admin/inventory"
                className="rounded-xl p-3 flex items-center gap-3 bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-700/50 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
              >
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  <span className="font-semibold">{item.label} cylinders</span> are low — only{" "}
                  <span className="font-semibold">{item.availableStock}</span> available
                </p>
              </Link>
            ))}
          </div>
        )}

        {/* Quick actions */}
        <section>
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: "/admin/customers/new", label: "Add Customer", icon: Users },
              { href: "/admin/payments", label: "Review Payments", icon: CreditCard },
              { href: "/admin/inventory", label: "Manage Inventory", icon: Package },
              { href: "/admin/orders", label: "View Orders", icon: ShoppingCart },
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="glass-sm rounded-xl p-4 flex flex-col items-center gap-2 text-center hover:shadow-sm transition-shadow"
              >
                <Icon className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Empty state hint when no activity */}
        {stats.totalOrders === 0 && (
          <div className="glass-sm rounded-xl p-6 text-center space-y-2">
            <Package className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No orders yet</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Start by adding customers and seeding the inventory.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
