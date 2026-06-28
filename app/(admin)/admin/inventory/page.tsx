import type { Metadata } from "next";
import { TopBar } from "@/components/layout/top-bar";
import { getInventoryWithTypes, getRecentAdjustments } from "@/lib/db/queries/inventory";
import { AdjustStockForm } from "@/components/admin/adjust-stock-form";
import { formatDate } from "@/lib/utils/format-date";
import { Package } from "lucide-react";

export const metadata: Metadata = { title: "Inventory" };

const LOW_STOCK_THRESHOLD = 10;

const TYPE_COLORS: Record<string, string> = {
  "15kg": "from-cyan-500 to-blue-500",
  "17kg": "from-teal-500 to-emerald-500",
  "20kg": "from-violet-500 to-purple-500",
};

function colorFor(label: string): string {
  return TYPE_COLORS[label.toLowerCase().replace(/\s+/g, "")] ?? "from-slate-400 to-slate-500";
}

export default async function AdminInventoryPage() {
  const [stock, adjustments] = await Promise.all([
    getInventoryWithTypes(),
    getRecentAdjustments(10),
  ]);

  return (
    <>
      <TopBar title="Inventory" />
      <div className="flex-1 p-4 space-y-5">

        {stock.length === 0 ? (
          <div className="glass-sm rounded-2xl p-10 text-center space-y-2">
            <Package className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="font-semibold text-slate-700 dark:text-slate-200">No inventory data</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Run{" "}
              <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">
                pnpm db:seed
              </code>{" "}
              to populate cylinder types.
            </p>
          </div>
        ) : (
          stock.map((s) => {
            const isLow = s.availableStock < LOW_STOCK_THRESHOLD;
            return (
              <div
                key={s.inventoryId}
                className={`glass rounded-2xl p-5 space-y-5 ${
                  isLow ? "ring-1 ring-red-300 dark:ring-red-700" : ""
                }`}
              >
                {/* ── Header: icon + label + price + low badge ── */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorFor(s.label)} flex items-center justify-center`}
                    >
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-50 text-base leading-tight">
                        {s.label}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        ₹{parseFloat(s.unitPrice).toLocaleString("en-IN")} / cylinder
                      </p>
                    </div>
                  </div>
                  {isLow && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 font-semibold">
                      Low Stock
                    </span>
                  )}
                </div>

                {/* ── Big total number ── */}
                <div className="text-center py-1">
                  <p className="text-6xl font-black tabular text-slate-900 dark:text-slate-50 leading-none">
                    {s.totalStock}
                  </p>
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">
                    Total cylinders
                  </p>
                </div>

                {/* ── Secondary stats ── */}
                <div className="flex items-center justify-center gap-0 divide-x divide-slate-200 dark:divide-slate-700">
                  {[
                    { label: "Available", value: s.availableStock, color: isLow ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400" },
                    { label: "Reserved",  value: s.reservedStock,  color: "text-amber-600 dark:text-amber-400" },
                    { label: "Delivered", value: s.deliveredStock, color: "text-slate-600 dark:text-slate-400" },
                  ].map((col) => (
                    <div key={col.label} className="flex-1 text-center px-2">
                      <p className={`text-xl font-bold tabular ${col.color}`}>{col.value}</p>
                      <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                        {col.label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* ── Add / Reduce form ── */}
                <AdjustStockForm
                  inventoryId={s.inventoryId}
                  cylinderTypeId={s.cylinderTypeId}
                  label={s.label}
                  availableStock={s.availableStock}
                  reservedStock={s.reservedStock}
                  deliveredStock={s.deliveredStock}
                  totalStock={s.totalStock}
                />
              </div>
            );
          })
        )}

        {/* ── Recent adjustments ── */}
        {adjustments.length > 0 && (
          <section>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
              Recent Adjustments
            </h3>
            <div className="space-y-2">
              {adjustments.map((adj) => (
                <div
                  key={adj.id}
                  className="glass-sm rounded-xl px-4 py-3 flex items-center gap-3"
                >
                  <span
                    className={`text-sm font-bold tabular w-12 shrink-0 ${
                      adj.delta > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {adj.delta > 0 ? `+${adj.delta}` : adj.delta}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">
                      {adj.label} — {adj.reason}
                    </p>
                    {adj.adjustedAt && (
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {formatDate(adj.adjustedAt)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
