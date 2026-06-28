"use client";

import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Minus, X, Truck, Package, AlertTriangle, PenLine } from "lucide-react";
import { toast } from "sonner";
import { adjustInventoryAction } from "@/app/actions/inventory";
import type { AdjustStockInput, ReduceType } from "@/lib/schemas/inventory";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  inventoryId: string;
  cylinderTypeId: string;
  label: string;
  availableStock: number;
  reservedStock: number;
  deliveredStock: number;
  totalStock: number;
}

type Mode = "add" | "reduce" | null;

const REDUCE_PILLS: {
  value: ReduceType;
  label: string;
  icon: React.ElementType;
  effect: string;
}[] = [
  { value: "delivered", label: "Delivered",     icon: Truck,         effect: "Reserved → Delivered" },
  { value: "reserved",  label: "Reserved",      icon: Package,       effect: "Reserved stock ↑"  },
  { value: "damaged",   label: "Damaged / Lost", icon: AlertTriangle, effect: "Written off"       },
  { value: "other",     label: "Other",          icon: PenLine,       effect: "Written off"       },
];

const SLIDE: Parameters<typeof motion.div>[0] = {
  initial:    { opacity: 0, height: 0 },
  animate:    { opacity: 1, height: "auto" },
  exit:       { opacity: 0, height: 0 },
  transition: {
    height:  { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
    opacity: { duration: 0.18 },
  },
};

const INPUT_CLS =
  "w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 " +
  "bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-50 " +
  "placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40";

// ─── Component ────────────────────────────────────────────────────────────────

export function AdjustStockForm({
  inventoryId,
  cylinderTypeId,
  label,
  availableStock,
  reservedStock,
  deliveredStock,
  totalStock,
}: Props) {
  const [mode, setMode]           = useState<Mode>(null);
  const [qty, setQty]             = useState("");
  const [reduceType, setReduceType] = useState<ReduceType | null>(null);
  const [note, setNote]           = useState("");
  const [pending, startTransition] = useTransition();

  const containerRef = useRef<HTMLDivElement>(null);
  const qtyNum = parseInt(qty, 10) || 0;

  // ── Close helpers ──────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setMode(null);
    setQty("");
    setReduceType(null);
    setNote("");
  }, []);

  function toggleMode(m: Mode) {
    if (mode === m) { reset(); return; }
    setMode(m);
    setQty("");
    setReduceType(null);
    setNote("");
  }

  // Escape key closes the panel
  useEffect(() => {
    if (!mode) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") reset(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mode, reset]);

  // Click outside the card closes the panel
  useEffect(() => {
    if (!mode) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        reset();
      }
    };
    // Use capture so it fires before any child stopPropagation
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [mode, reset]);

  // ── Impact preview ──────────────────────────────────────────────────────────

  function previewRows() {
    if (!qtyNum) return null;
    if (mode === "add") {
      return [
        { label: "Available", before: availableStock, after: availableStock + qtyNum, color: "text-emerald-600 dark:text-emerald-400" },
        { label: "Total",     before: totalStock,     after: totalStock     + qtyNum, color: "text-slate-700 dark:text-slate-200"    },
      ];
    }
    if (!reduceType) return null;

    if (reduceType === "delivered") {
      // Delivered: reserved → delivered (available and total unchanged)
      return [
        { label: "Reserved",  before: reservedStock,  after: reservedStock  - qtyNum, color: "text-slate-700 dark:text-slate-200"     },
        { label: "Delivered", before: deliveredStock, after: deliveredStock + qtyNum, color: "text-teal-600 dark:text-teal-400"       },
      ];
    }
    if (reduceType === "reserved") {
      return [
        { label: "Available", before: availableStock, after: availableStock - qtyNum, color: "text-slate-700 dark:text-slate-200"      },
        { label: "Reserved",  before: reservedStock,  after: reservedStock  + qtyNum, color: "text-amber-600 dark:text-amber-400"      },
      ];
    }
    // damaged / other — write-off from warehouse shelf
    return [
      { label: "Available", before: availableStock, after: availableStock - qtyNum, color: "text-red-600 dark:text-red-400" },
      { label: "Total",     before: totalStock,     after: totalStock     - qtyNum, color: "text-red-600 dark:text-red-400" },
    ];
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!qtyNum || qtyNum <= 0)                                          { toast.error("Enter a valid quantity"); return; }
    if (mode === "reduce" && !reduceType)                                 { toast.error("Select a reason"); return; }
    if (mode === "reduce" && reduceType === "other" && note.trim().length < 3) { toast.error("Enter a reason (min 3 characters)"); return; }

    const input: AdjustStockInput = {
      inventoryId, cylinderTypeId,
      qty: qtyNum,
      mode: mode!,
      reduceType: mode === "reduce" ? reduceType! : undefined,
      reason: note.trim() || undefined,
    };

    startTransition(async () => {
      const result = await adjustInventoryAction(input);
      if (!result.ok) { toast.error(result.error); return; }
      const msg =
        mode === "add"            ? `${label}: +${qtyNum} added`
        : reduceType === "delivered" ? `${label}: ${qtyNum} marked delivered`
        : reduceType === "reserved"  ? `${label}: ${qtyNum} set aside`
        : reduceType === "damaged"   ? `${label}: ${qtyNum} written off`
        :                             `${label}: adjusted −${qtyNum}`;
      toast.success(msg);
      reset();
    });
  }

  const rows = previewRows();

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div ref={containerRef} className="space-y-3">

      {/* Trigger buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => toggleMode("add")}
          className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm transition-all ${
            mode === "add"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
          }`}
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Add Stock
        </button>
        <button
          type="button"
          onClick={() => toggleMode("reduce")}
          className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm transition-all ${
            mode === "reduce"
              ? "bg-red-600 text-white shadow-sm"
              : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 hover:bg-red-100 dark:hover:bg-red-900/30"
          }`}
        >
          <Minus className="w-4 h-4" strokeWidth={2.5} />
          Reduce
        </button>
      </div>

      {/* Animated slide-down panel */}
      <AnimatePresence initial={false}>
        {mode && (
          <motion.div
            key={mode}
            {...SLIDE}
            className="overflow-hidden"
          >
            {/* Inner wrapper gives padding room so ring/shadow isn't clipped */}
            <div className="pt-1">
              <form
                onSubmit={handleSubmit}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4 space-y-4"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {mode === "add" ? "Add Stock" : "Reduce Stock"}
                  </p>
                  <button
                    type="button"
                    onClick={reset}
                    aria-label="Close"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Reduce: pick reason first */}
                {mode === "reduce" && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Reason
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {REDUCE_PILLS.map(({ value, label: pillLabel, icon: Icon, effect }) => {
                        const active = reduceType === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setReduceType(value)}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${
                              active
                                ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/25"
                                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
                            }`}
                          >
                            <Icon className={`w-4 h-4 shrink-0 ${active ? "text-cyan-600 dark:text-cyan-400" : "text-slate-400"}`} />
                            <div className="min-w-0">
                              <p className={`text-xs font-semibold leading-tight ${active ? "text-cyan-700 dark:text-cyan-300" : "text-slate-700 dark:text-slate-200"}`}>
                                {pillLabel}
                              </p>
                              <p className="text-xs text-slate-400 dark:text-slate-500 leading-tight">{effect}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* "Other" reason text */}
                {mode === "reduce" && reduceType === "other" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                      Describe reason
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Returned to supplier"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className={INPUT_CLS}
                      autoFocus
                    />
                  </div>
                )}

                {/* Quantity + note */}
                <div className={`grid gap-3 ${mode === "add" ? "grid-cols-2" : "grid-cols-1"}`}>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                      Quantity
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={mode === "reduce"
                        ? (reduceType === "delivered" ? reservedStock : availableStock)
                        : undefined}
                      placeholder="0"
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      className={INPUT_CLS}
                      autoFocus={mode === "add"}
                    />
                    {mode === "reduce" && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        {reduceType === "delivered"
                          ? `${reservedStock} reserved`
                          : `${availableStock} available`}
                      </p>
                    )}
                  </div>
                  {mode === "add" && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                        Note <span className="font-normal normal-case text-slate-400">(optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Supplier delivery"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className={INPUT_CLS}
                      />
                    </div>
                  )}
                </div>

                {/* Impact preview */}
                {rows && qtyNum > 0 && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
                    {rows.map((row) => (
                      <div key={row.label} className="flex items-center justify-between px-3 py-2">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{row.label}</span>
                        <span className={`text-xs font-bold tabular ${row.color}`}>
                          {row.before} → {row.after}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Confirm */}
                <button
                  type="submit"
                  disabled={pending || (mode === "reduce" && !reduceType)}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {pending
                    ? "Saving…"
                    : mode === "add"
                    ? `Add ${qtyNum || "—"} cylinders`
                    : `Reduce ${qtyNum || "—"} cylinders`}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
