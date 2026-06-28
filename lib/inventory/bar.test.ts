import { describe, it, expect } from "vitest";
import { computeInventoryBar, LABEL_MIN_PCT } from "./bar";

describe("computeInventoryBar", () => {
  // ── edge cases ────────────────────────────────────────────────────────────

  it("returns all-zero segments when total is 0", () => {
    const bar = computeInventoryBar(0, 0, 0, 0);
    expect(bar.total).toBe(0);
    expect(bar.available).toEqual({ count: 0, pct: 0, showLabel: false });
    expect(bar.reserved).toEqual({ count: 0, pct: 0, showLabel: false });
    expect(bar.delivered).toEqual({ count: 0, pct: 0, showLabel: false });
  });

  it("zero-count segment has pct=0 and showLabel=false", () => {
    const bar = computeInventoryBar(100, 100, 0, 0);
    expect(bar.reserved.count).toBe(0);
    expect(bar.reserved.pct).toBe(0);
    expect(bar.reserved.showLabel).toBe(false);
    expect(bar.delivered.pct).toBe(0);
    expect(bar.delivered.showLabel).toBe(false);
  });

  // ── typical seeded data (15 kg: 89 avail / 8 reserved / 3 delivered) ────

  it("correctly computes 15 kg seeded inventory (89/8/3 of 100)", () => {
    const bar = computeInventoryBar(100, 89, 8, 3);
    expect(bar.total).toBe(100);
    expect(bar.available.count).toBe(89);
    expect(bar.available.pct).toBe(89);
    expect(bar.available.showLabel).toBe(true); // 89 >= LABEL_MIN_PCT

    expect(bar.reserved.count).toBe(8);
    expect(bar.reserved.pct).toBe(8);
    expect(bar.reserved.showLabel).toBe(false); // 8 < LABEL_MIN_PCT

    expect(bar.delivered.count).toBe(3);
    expect(bar.delivered.pct).toBe(3);
    expect(bar.delivered.showLabel).toBe(false); // 3 < LABEL_MIN_PCT
  });

  // ── LABEL_MIN_PCT boundary ───────────────────────────────────────────────

  it("shows label when segment is exactly at LABEL_MIN_PCT", () => {
    // LABEL_MIN_PCT percent of 100 → exactly at boundary
    const bar = computeInventoryBar(100, LABEL_MIN_PCT, 100 - LABEL_MIN_PCT, 0);
    expect(bar.available.showLabel).toBe(true);
  });

  it("hides label when segment is one point below LABEL_MIN_PCT", () => {
    const justBelow = LABEL_MIN_PCT - 1;
    const bar = computeInventoryBar(100, justBelow, 100 - justBelow, 0);
    expect(bar.available.showLabel).toBe(false);
  });

  it("shows label for reserved segment when it meets the threshold", () => {
    // 20 reserved of 100 = 20% — above threshold
    const bar = computeInventoryBar(100, 80, 20, 0);
    expect(bar.reserved.showLabel).toBe(true);
  });

  it("shows label for delivered segment when it meets the threshold", () => {
    // 15 delivered of 100 = 15% — above threshold
    const bar = computeInventoryBar(100, 70, 15, 15);
    expect(bar.delivered.showLabel).toBe(true);
  });

  // ── all-available case ───────────────────────────────────────────────────

  it("handles all-available stock (nothing reserved or delivered)", () => {
    const bar = computeInventoryBar(50, 50, 0, 0);
    expect(bar.available.pct).toBe(100);
    expect(bar.available.showLabel).toBe(true);
    expect(bar.reserved.pct).toBe(0);
    expect(bar.delivered.pct).toBe(0);
  });

  // ── rounding ─────────────────────────────────────────────────────────────

  it("rounds percentages to nearest integer", () => {
    // 1 of 3 ≈ 33.33% → rounds to 33
    const bar = computeInventoryBar(3, 1, 1, 1);
    expect(bar.available.pct).toBe(33);
    expect(bar.reserved.pct).toBe(33);
    expect(bar.delivered.pct).toBe(33);
  });

  // ── total is preserved ────────────────────────────────────────────────────

  it("preserves total regardless of segment values", () => {
    const bar = computeInventoryBar(30, 28, 2, 0);
    expect(bar.total).toBe(30);
  });
});
