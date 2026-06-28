import { describe, it, expect } from "vitest";
import { computeStockAdjustment } from "./compute";
import type { StockState } from "./compute";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const BASE: StockState = {
  availableStock: 20,
  totalStock: 30,
  reservedStock: 5,
  deliveredStock: 5,
};

// Helper — build a state with specific overrides
function state(overrides: Partial<StockState>): StockState {
  return { ...BASE, ...overrides };
}

// ─── ADD mode ─────────────────────────────────────────────────────────────────

describe("computeStockAdjustment — add", () => {
  it("increases available and total by qty", () => {
    const result = computeStockAdjustment(BASE, { mode: "add", qty: 10 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.next.availableStock).toBe(30);
    expect(result.next.totalStock).toBe(40);
  });

  it("does not change reserved or delivered stock", () => {
    const result = computeStockAdjustment(BASE, { mode: "add", qty: 5 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.next.reservedStock).toBe(BASE.reservedStock);
    expect(result.next.deliveredStock).toBe(BASE.deliveredStock);
  });

  it("returns a positive delta equal to qty", () => {
    const result = computeStockAdjustment(BASE, { mode: "add", qty: 7 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.delta).toBe(7);
  });

  it("works when available stock is zero (fresh add)", () => {
    const empty = state({ availableStock: 0, totalStock: 0 });
    const result = computeStockAdjustment(empty, { mode: "add", qty: 50 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.next.availableStock).toBe(50);
    expect(result.next.totalStock).toBe(50);
  });

  it("rejects qty = 0", () => {
    const result = computeStockAdjustment(BASE, { mode: "add", qty: 0 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/greater than zero/i);
  });

  it("rejects negative qty", () => {
    const result = computeStockAdjustment(BASE, { mode: "add", qty: -5 });
    expect(result.ok).toBe(false);
  });

  it("adds qty of 1 correctly (boundary)", () => {
    const result = computeStockAdjustment(BASE, { mode: "add", qty: 1 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.next.availableStock).toBe(21);
    expect(result.next.totalStock).toBe(31);
  });
});

// ─── REDUCE — delivered ───────────────────────────────────────────────────────
// Stock lifecycle: Available → (booking) → Reserved → (delivery) → Delivered
// "Delivered" manual reduce = cylinders that were reserved and are now physically
// handed over outside the normal order flow. Reduces RESERVED, not available.

describe("computeStockAdjustment — reduce/delivered", () => {
  it("decreases reserved, increases delivered; available and total unchanged", () => {
    const result = computeStockAdjustment(BASE, {
      mode: "reduce", qty: 3, reduceType: "delivered",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.next.reservedStock).toBe(2);   // 5 − 3
    expect(result.next.deliveredStock).toBe(8);  // 5 + 3
    expect(result.next.availableStock).toBe(BASE.availableStock); // unchanged
    expect(result.next.totalStock).toBe(BASE.totalStock);         // unchanged
  });

  it("returns a negative delta equal to −qty", () => {
    const result = computeStockAdjustment(BASE, {
      mode: "reduce", qty: 3, reduceType: "delivered",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.delta).toBe(-3);
  });

  it("allows reducing exactly reserved stock (boundary)", () => {
    const result = computeStockAdjustment(BASE, {
      mode: "reduce", qty: 5, reduceType: "delivered", // BASE.reservedStock = 5
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.next.reservedStock).toBe(0);
    expect(result.next.deliveredStock).toBe(10);
    expect(result.next.availableStock).toBe(BASE.availableStock);
  });

  it("rejects reducing more than reserved stock", () => {
    const result = computeStockAdjustment(BASE, {
      mode: "reduce", qty: 6, reduceType: "delivered", // only 5 reserved
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/only 5 reserved/i);
  });

  it("rejects when reserved stock is zero", () => {
    const noReserved = state({ reservedStock: 0 });
    const result = computeStockAdjustment(noReserved, {
      mode: "reduce", qty: 1, reduceType: "delivered",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/only 0 reserved/i);
  });
});

// ─── REDUCE — reserved ────────────────────────────────────────────────────────

describe("computeStockAdjustment — reduce/reserved", () => {
  it("decreases available, increases reserved, total unchanged", () => {
    const result = computeStockAdjustment(BASE, {
      mode: "reduce", qty: 4, reduceType: "reserved",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.next.availableStock).toBe(16);
    expect(result.next.reservedStock).toBe(9);
    expect(result.next.totalStock).toBe(BASE.totalStock);
    expect(result.next.deliveredStock).toBe(BASE.deliveredStock);
  });

  it("returns a negative delta equal to −qty", () => {
    const result = computeStockAdjustment(BASE, {
      mode: "reduce", qty: 4, reduceType: "reserved",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.delta).toBe(-4);
  });

  it("allows reducing exactly all available stock (boundary)", () => {
    // BASE.availableStock = 20
    const result = computeStockAdjustment(BASE, {
      mode: "reduce", qty: 20, reduceType: "reserved",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.next.availableStock).toBe(0);
    expect(result.next.reservedStock).toBe(25);  // 5 + 20
  });

  it("rejects reducing more than available stock", () => {
    // BASE.availableStock = 20
    const result = computeStockAdjustment(BASE, {
      mode: "reduce", qty: 21, reduceType: "reserved",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/only 20 available/i);
  });

  it("total stock stays the same for reserved (available → reserved is a relabel, not write-off)", () => {
    const result = computeStockAdjustment(BASE, {
      mode: "reduce", qty: 10, reduceType: "reserved",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // availableStock + reservedStock must equal the same pre-adjustment total (excl. delivered)
    const beforeActive = BASE.availableStock + BASE.reservedStock;
    const afterActive  = result.next.availableStock + result.next.reservedStock;
    expect(afterActive).toBe(beforeActive);
  });
});

// ─── REDUCE — damaged ─────────────────────────────────────────────────────────

describe("computeStockAdjustment — reduce/damaged", () => {
  it("decreases available AND total (write-off)", () => {
    const result = computeStockAdjustment(BASE, {
      mode: "reduce", qty: 2, reduceType: "damaged",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.next.availableStock).toBe(18);
    expect(result.next.totalStock).toBe(28);
    expect(result.next.reservedStock).toBe(BASE.reservedStock);
    expect(result.next.deliveredStock).toBe(BASE.deliveredStock);
  });
});

// ─── REDUCE — other ───────────────────────────────────────────────────────────

describe("computeStockAdjustment — reduce/other", () => {
  it("decreases available AND total (write-off)", () => {
    const result = computeStockAdjustment(BASE, {
      mode: "reduce", qty: 5, reduceType: "other",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.next.availableStock).toBe(15);
    expect(result.next.totalStock).toBe(25);
  });

  it("reserved and delivered unchanged for other", () => {
    const result = computeStockAdjustment(BASE, {
      mode: "reduce", qty: 1, reduceType: "other",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.next.reservedStock).toBe(BASE.reservedStock);
    expect(result.next.deliveredStock).toBe(BASE.deliveredStock);
  });
});

// ─── REDUCE — guard: missing reduceType ──────────────────────────────────────

describe("computeStockAdjustment — reduce guard", () => {
  it("errors when reduceType is missing", () => {
    const result = computeStockAdjustment(BASE, { mode: "reduce", qty: 5 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/reduceType is required/i);
  });

  it("rejects qty = 0 in reduce mode", () => {
    const result = computeStockAdjustment(BASE, {
      mode: "reduce", qty: 0, reduceType: "damaged",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/greater than zero/i);
  });

  it("rejects reduce on empty stock", () => {
    const empty = state({ availableStock: 0 });
    const result = computeStockAdjustment(empty, {
      mode: "reduce", qty: 1, reduceType: "damaged",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/only 0 available/i);
  });
});

// ─── Stock invariant checks ───────────────────────────────────────────────────

describe("stock invariants", () => {
  const reductions: Array<{ reduceType: "delivered" | "reserved" | "damaged" | "other" }> = [
    { reduceType: "delivered" },
    { reduceType: "reserved" },
    { reduceType: "damaged" },
    { reduceType: "other" },
  ];

  for (const { reduceType } of reductions) {
    it(`stock never goes negative for reduce/${reduceType} at boundary`, () => {
      // delivered caps against reservedStock; others cap against availableStock
      const maxQty =
        reduceType === "delivered" ? BASE.reservedStock : BASE.availableStock;
      const result = computeStockAdjustment(BASE, {
        mode: "reduce", qty: maxQty, reduceType,
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.next.availableStock).toBeGreaterThanOrEqual(0);
      expect(result.next.reservedStock).toBeGreaterThanOrEqual(0);
      expect(result.next.deliveredStock).toBeGreaterThanOrEqual(0);
      expect(result.next.totalStock).toBeGreaterThanOrEqual(0);
    });
  }

  it("add: result state has no negative fields", () => {
    const result = computeStockAdjustment(
      state({ availableStock: 0, totalStock: 5 }),
      { mode: "add", qty: 10 }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { next } = result;
    expect(next.availableStock).toBeGreaterThanOrEqual(0);
    expect(next.totalStock).toBeGreaterThanOrEqual(0);
    expect(next.reservedStock).toBeGreaterThanOrEqual(0);
    expect(next.deliveredStock).toBeGreaterThanOrEqual(0);
  });
});
