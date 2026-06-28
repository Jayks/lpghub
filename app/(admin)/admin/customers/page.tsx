import type { Metadata } from "next";
import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { PageWrapper } from "@/components/shared/page-wrapper";
import { EmptyState } from "@/components/shared/empty-state";
import { getCustomers } from "@/lib/db/queries/customers";
import { Plus, ChevronRight, Users } from "lucide-react";

export const metadata: Metadata = { title: "Customers" };

/** Inline gradient stops per index — avoids Tailwind purging dynamic class strings. */
const AVATAR_COLORS: [string, string][] = [
  ["#0891B2", "#14B8A6"], // cyan → teal
  ["#8B5CF6", "#A855F7"], // violet → purple
  ["#F43F5E", "#EC4899"], // rose → pink
  ["#F59E0B", "#F97316"], // amber → orange
  ["#10B981", "#22C55E"], // emerald → green
  ["#3B82F6", "#6366F1"], // blue → indigo
];

function avatarStyle(name: string): React.CSSProperties {
  // Sum all char codes so two names with the same initial still get different colours
  const idx =
    name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) %
    AVATAR_COLORS.length;
  const [from, to] = AVATAR_COLORS[idx];
  return { background: `linear-gradient(135deg, ${from}, ${to})` };
}

export default async function AdminCustomersPage() {
  const customerList = await getCustomers();

  return (
    <>
      <TopBar
        title="Customers"
        actions={
          <Link
            href="/admin/customers/new"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-gradient-to-br from-cyan-500 to-teal-500 text-white"
          >
            <Plus className="w-4 h-4" /> Add
          </Link>
        }
      />
      <PageWrapper className="flex-1 p-4 space-y-4">

        {customerList.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customers yet"
            description="Add your first customer to get started."
            action={
              <Link
                href="/admin/customers/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-br from-cyan-500 to-teal-500 text-white"
              >
                <Plus className="w-4 h-4" /> Add Customer
              </Link>
            }
          />
        ) : (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {customerList.length} customer{customerList.length !== 1 ? "s" : ""}
            </p>
            <div className="space-y-2">
              {customerList.map((c) => (
                <Link
                  key={c.id}
                  href={`/admin/customers/${c.id}`}
                  className="glass-sm rounded-xl px-4 py-3.5 flex items-center gap-3 hover:shadow-sm transition-shadow"
                >
                  {/* Avatar with per-name color */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={avatarStyle(c.businessName)}
                  >
                    {c.businessName[0].toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">
                      {c.businessName}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                      {c.contactPerson} · {c.phone.replace("+91", "")}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        c.isActive
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                      }`}
                    >
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </PageWrapper>
    </>
  );
}
