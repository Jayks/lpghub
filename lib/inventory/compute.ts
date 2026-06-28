import type { ReduceType } from "@/lib/schemas/inventory";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StockState {
  availableStock: number;
  totalStock: number;
  reservedStock: number;
  deliveredStock: number;
}

export interface StockAdjustment {
  mode: "add" | "reduce";
  qty: number;
  reduceType?: ReduceType;
}

export type StockAdjustmentResult =
  | { ok: true; next: StockState; delta: number }
  | { ok: false; error: string };

// ─── Pure computation ─────────────────────────────────────────────────────────

/**
 * Compute the new stock state after an adjustment.
 * No side effects — does not touch the database.
 *
 * Stock lifecycle:  Available → (booking) → Reserved → (delivery) → Delivered
 *
 * Stock rules:
 *   add              → available +qty, total +qty
 *   reduce/delivered → reserved  −qty, delivered +qty  (manual reconciliation of reserved cylinders handed over)
 *   reduce/reserved  → available −qty, reserved  +qty  (admin sets aside available stock)
 *   reduce/damaged   → available −qty, total     −qty  (write-off from warehouse shelf)
 *   reduce/other     → available −qty, total     −qty  (write-off from warehouse shelf)
 */
export function computeStockAdjustment(
  current: StockState,
  adj: StockAdjustment
): StockAdjustmentResult {
  const { availableStock, totalStock, reservedStock, deliveredStock } = current;
  const { mode, qty, reduceType } = adj;

  if (qty <= 0) {
    return { ok: false, error: "Quantity must be greater than zero." };
  }

  if (mode === "add") {
    return {
      ok: true,
      delta: qty,
      next: {
        availableStock: availableStock + qty,
        totalStock: totalStock + qty,
        reservedStock,
        deliveredStock,
      },
    };
  }

  // mode === "reduce"
  if (!reduceType) {
    return { ok: false, error: "reduceType is required for reductions." };
  }

  if (reduceType === "delivered") {
    // Delivered cylinders come from reserved stock, not available stock
    if (qty > reservedStock) {
      return {
        ok: false,
        error: `Cannot mark ${qty} as delivered — only ${reservedStock} reserved.`,
      };
    }
    return {
      ok: true,
      delta: -qty,
      next: {
        availableStock,
        totalStock,
        reservedStock:  reservedStock  - qty,
        deliveredStock: deliveredStock + qty,
      },
    };
  }

  // reserved, damaged, other — all reduce from available stock
  if (qty > availableStock) {
    return {
      ok: false,
      error: `Cannot reduce by ${qty} — only ${availableStock} available.`,
    };
  }

  const next: StockState = {
    availableStock: availableStock - qty,
    totalStock,
    reservedStock,
    deliveredStock,
  };

  switch (reduceType) {
    case "reserved":
      next.reservedStock = reservedStock + qty;
      break;
    case "damaged":
    case "other":
      next.totalStock = totalStock - qty;
      break;
  }

  return { ok: true, delta: -qty, next };
}
