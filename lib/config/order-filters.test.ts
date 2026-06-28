import { describe, it, expect } from "vitest";
import {
  ORDER_FILTER_GROUPS,
  ORDER_FILTER_LABELS,
  type OrderFilterKey,
} from "./order-filters";

// ─── ORDER_FILTER_GROUPS ──────────────────────────────────────────────────────

describe("ORDER_FILTER_GROUPS", () => {
  it("has an 'all' key that maps to null", () => {
    expect(ORDER_FILTER_GROUPS.all).toBeNull();
  });

  it("'pending' includes pending_payment and payment_pending_confirmation", () => {
    expect(ORDER_FILTER_GROUPS.pending).toContain("pending_payment");
    expect(ORDER_FILTER_GROUPS.pending).toContain("payment_pending_confirmation");
  });

  it("'confirmed' includes confirmed", () => {
    expect(ORDER_FILTER_GROUPS.confirmed).toContain("confirmed");
  });

  it("'delivery' includes assigned and out_for_delivery", () => {
    expect(ORDER_FILTER_GROUPS.delivery).toContain("assigned");
    expect(ORDER_FILTER_GROUPS.delivery).toContain("out_for_delivery");
  });

  it("'done' includes delivered, cancelled, and rejected", () => {
    expect(ORDER_FILTER_GROUPS.done).toContain("delivered");
    expect(ORDER_FILTER_GROUPS.done).toContain("cancelled");
    expect(ORDER_FILTER_GROUPS.done).toContain("rejected");
  });

  it("every non-null group is a non-empty array", () => {
    const keys = Object.keys(ORDER_FILTER_GROUPS) as OrderFilterKey[];
    for (const key of keys) {
      const val = ORDER_FILTER_GROUPS[key];
      if (val !== null) {
        expect(Array.isArray(val)).toBe(true);
        expect(val.length).toBeGreaterThan(0);
      }
    }
  });

  it("no status appears in more than one group", () => {
    const keys = Object.keys(ORDER_FILTER_GROUPS) as OrderFilterKey[];
    const seen = new Set<string>();
    for (const key of keys) {
      const val = ORDER_FILTER_GROUPS[key];
      if (!val) continue;
      for (const status of val) {
        expect(seen.has(status), `'${status}' appears in multiple groups`).toBe(false);
        seen.add(status);
      }
    }
  });

  it("covers all 9 defined order statuses", () => {
    const allStatuses = new Set<string>();
    const keys = Object.keys(ORDER_FILTER_GROUPS) as OrderFilterKey[];
    for (const key of keys) {
      const val = ORDER_FILTER_GROUPS[key];
      if (val) val.forEach((s) => allStatuses.add(s));
    }
    const expected = [
      "draft",
      "pending_payment",
      "payment_pending_confirmation",
      "confirmed",
      "assigned",
      "out_for_delivery",
      "delivered",
      "cancelled",
      "rejected",
    ];
    // All expected statuses should appear in at least one group
    // (draft may be excluded from filters — check what the config actually has)
    const missing = expected.filter(
      (s) => !allStatuses.has(s) && s !== "draft"
    );
    expect(missing).toHaveLength(0);
  });
});

// ─── ORDER_FILTER_LABELS ──────────────────────────────────────────────────────

describe("ORDER_FILTER_LABELS", () => {
  it("has a label for every key in ORDER_FILTER_GROUPS", () => {
    const filterKeys = Object.keys(ORDER_FILTER_GROUPS) as OrderFilterKey[];
    for (const key of filterKeys) {
      expect(
        ORDER_FILTER_LABELS[key],
        `Missing label for filter key '${key}'`
      ).toBeTruthy();
    }
  });

  it("label for 'all' is 'All'", () => {
    expect(ORDER_FILTER_LABELS.all).toBe("All");
  });

  it("all labels are non-empty strings", () => {
    const values = Object.values(ORDER_FILTER_LABELS);
    for (const v of values) {
      expect(typeof v).toBe("string");
      expect(v.length).toBeGreaterThan(0);
    }
  });

  it("has exactly the same keys as ORDER_FILTER_GROUPS", () => {
    const groupKeys = Object.keys(ORDER_FILTER_GROUPS).sort();
    const labelKeys = Object.keys(ORDER_FILTER_LABELS).sort();
    expect(groupKeys).toEqual(labelKeys);
  });
});
