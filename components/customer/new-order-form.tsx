"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Loader2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { createOrderAction } from "@/app/actions/orders";
import type { InventoryRow } from "@/lib/db/queries/inventory";

interface Props {
  stock: InventoryRow[];
  eligibilityLimit: number;
  activeCylinders: number; // cylinders already committed in open orders
}

export function NewOrderForm({ stock, eligibilityLimit, activeCylinders }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // qty keyed by cylinderTypeId
  const [qty, setQty] = useState<Record<string, number>>(
    Object.fromEntries(stock.map((s) => [s.cylinderTypeId, 0]))
  );

  const totalQty    = Object.values(qty).reduce((a, b) => a + b, 0);
  const totalAmount = stock.reduce(
    (sum, s) => sum + (qty[s.cylinderTypeId] ?? 0) * Number(s.unitPrice),
    0
  );
  // Effective remaining = limit minus cylinders already in active orders minus what's in this form
  const effectiveLimit = eligibilityLimit - activeCylinders;
  const remaining      = effectiveLimit - totalQty;

  function increment(cylinderTypeId: string, availableStock: number) {
    setQty((prev) => {
      const cur = prev[cylinderTypeId] ?? 0;
      if (totalQty >= effectiveLimit) {
        toast.error(`Eligibility limit reached (${eligibilityLimit} cylinders total, ${activeCylinders} already in active orders)`);
        return prev;
      }
      if (cur >= availableStock) {
        toast.error("No more stock available for this type");
        return prev;
      }
      return { ...prev, [cylinderTypeId]: cur + 1 };
    });
  }

  function decrement(cylinderTypeId: string) {
    setQty((prev) => {
      const cur = prev[cylinderTypeId] ?? 0;
      if (cur <= 0) return prev;
      return { ...prev, [cylinderTypeId]: cur - 1 };
    });
  }

  function handleSubmit() {
    if (totalQty === 0) {
      toast.error("Select at least one cylinder");
      return;
    }
    const lines = stock
      .filter((s) => (qty[s.cylinderTypeId] ?? 0) > 0)
      .map((s) => ({
        cylinderTypeId: s.cylinderTypeId,
        inventoryId:    s.inventoryId,
        quantity:       qty[s.cylinderTypeId]!,
      }));

    startTransition(async () => {
      const result = await createOrderAction(lines);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Order placed — proceed to payment");
      router.push(`/payments/${result.orderId}`);
    });
  }

  return (
    <div className="space-y-5">
      {/* Eligibility bar */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Eligibility limit</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 tabular-nums">
              {eligibilityLimit} cylinders
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Available to order</p>
            <p className={`text-2xl font-bold tabular-nums ${remaining <= 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
              {Math.max(0, remaining)}
            </p>
          </div>
        </div>
        {activeCylinders > 0 && (
          <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-1.5">
            {activeCylinders} cylinder{activeCylinders !== 1 ? "s" : ""} already in active orders
          </p>
        )}
      </div>

      {/* Cylinder type selectors */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          Select Cylinders
        </h3>
        {stock.map((s) => {
          const q = qty[s.cylinderTypeId] ?? 0;
          const outOfStock = s.availableStock === 0;
          return (
            <div
              key={s.cylinderTypeId}
              className={`glass-sm rounded-xl p-4 flex items-center gap-4 ${outOfStock ? "opacity-50" : ""}`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 dark:text-slate-50">{s.label}</p>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  ₹{Number(s.unitPrice).toLocaleString("en-IN")}
                  {outOfStock
                    ? " · Out of stock"
                    : ` · ${s.availableStock} available`}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => decrement(s.cylinderTypeId)}
                  disabled={q === 0 || pending}
                  className="w-9 h-9 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-7 text-center text-base font-bold text-slate-900 dark:text-slate-50 tabular-nums">
                  {q}
                </span>
                <button
                  type="button"
                  onClick={() => increment(s.cylinderTypeId, s.availableStock)}
                  disabled={outOfStock || remaining === 0 || pending}
                  className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-300 dark:border-cyan-700 flex items-center justify-center text-cyan-700 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </section>

      {/* Order summary */}
      {totalQty > 0 && (
        <div className="glass rounded-2xl p-4 space-y-2">
          {stock
            .filter((s) => (qty[s.cylinderTypeId] ?? 0) > 0)
            .map((s) => (
              <div key={s.cylinderTypeId} className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  {s.label} × {qty[s.cylinderTypeId]}
                </span>
                <span className="font-medium text-slate-900 dark:text-slate-50 tabular-nums">
                  ₹{(Number(s.unitPrice) * (qty[s.cylinderTypeId] ?? 0)).toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between font-bold">
            <span className="text-slate-900 dark:text-slate-50">Total</span>
            <span className="text-slate-900 dark:text-slate-50 tabular-nums">
              ₹{totalAmount.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={totalQty === 0 || pending}
        className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-br from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        {pending ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <ShoppingCart className="w-5 h-5" />
        )}
        {pending ? "Placing order…" : `Confirm Booking · ₹${totalAmount.toLocaleString("en-IN")}`}
      </button>
    </div>
  );
}
