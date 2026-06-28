import { describe, it, expect } from "vitest";
import { formatOrderNumber } from "./format-order-number";

describe("formatOrderNumber", () => {
  // ─── Basic formatting ────────────────────────────────────────────────────────

  it("formats order number 1 as 'ORD-1'", () => {
    expect(formatOrderNumber(1)).toBe("ORD-1");
  });

  it("formats a typical 4-digit order number", () => {
    expect(formatOrderNumber(1001)).toBe("ORD-1001");
  });

  it("formats 9999", () => {
    expect(formatOrderNumber(9999)).toBe("ORD-9999");
  });

  it("formats a 5-digit order number", () => {
    expect(formatOrderNumber(10000)).toBe("ORD-10000");
  });

  it("formats a large order number", () => {
    expect(formatOrderNumber(1000000)).toBe("ORD-1000000");
  });

  // ─── Prefix invariant ─────────────────────────────────────────────────────────

  it("always begins with the 'ORD-' prefix", () => {
    for (const n of [1, 42, 100, 9999, 100000]) {
      expect(formatOrderNumber(n)).toMatch(/^ORD-/);
    }
  });

  it("the prefix is exactly 'ORD-' (4 characters)", () => {
    const result = formatOrderNumber(500);
    expect(result.startsWith("ORD-")).toBe(true);
    expect(result.indexOf("-")).toBe(3);
  });

  // ─── Numeric suffix integrity ─────────────────────────────────────────────────

  it("the numeric part after the prefix matches the input exactly", () => {
    const result = formatOrderNumber(2048);
    const suffix = result.slice("ORD-".length);
    expect(suffix).toBe("2048");
    expect(Number(suffix)).toBe(2048);
  });

  it("does not zero-pad the number", () => {
    expect(formatOrderNumber(5)).toBe("ORD-5");   // not "ORD-0005"
    expect(formatOrderNumber(42)).toBe("ORD-42"); // not "ORD-0042"
  });

  // ─── Return type ─────────────────────────────────────────────────────────────

  it("always returns a string", () => {
    expect(typeof formatOrderNumber(1)).toBe("string");
    expect(typeof formatOrderNumber(99999)).toBe("string");
  });

  // ─── Boundary / edge cases ────────────────────────────────────────────────────

  it("formats order number 0 without crashing (edge case)", () => {
    // Zero is technically invalid in the app but must not throw
    expect(formatOrderNumber(0)).toBe("ORD-0");
  });
});
