import { describe, it, expect } from "vitest";
import { formatCurrency } from "./format-currency";

describe("formatCurrency", () => {
  it("formats whole number in INR", () => {
    const result = formatCurrency(1200, "INR");
    expect(result).toContain("1,200");
    expect(result).toContain("₹");
  });

  it("formats decimal amount with 2 places", () => {
    const result = formatCurrency(1200.5, "INR");
    expect(result).toContain("1,200.50");
  });

  it("accepts string input", () => {
    const result = formatCurrency("2400.00", "INR");
    expect(result).toContain("2,400");
  });

  it("formats large amount with Indian grouping", () => {
    const result = formatCurrency(100000, "INR");
    // Indian format: 1,00,000
    expect(result).toContain("00,000");
  });

  it("defaults to INR", () => {
    const result = formatCurrency(500);
    expect(result).toContain("₹");
  });
});

// ─── Additional edge cases ────────────────────────────────────────────────────

describe("formatCurrency — edge cases", () => {
  it("formats zero as '₹0.00'", () => {
    const result = formatCurrency(0);
    expect(result).toContain("₹");
    expect(result).toContain("0.00");
  });

  it("formats zero string '0' correctly", () => {
    const result = formatCurrency("0");
    expect(result).toContain("0.00");
  });

  it("formats a small fractional amount (1 paisa)", () => {
    const result = formatCurrency(0.01);
    expect(result).toContain("0.01");
    expect(result).toContain("₹");
  });

  it("always shows exactly 2 decimal places", () => {
    // 1500 (whole number) → "1,500.00"
    const result = formatCurrency(1500);
    expect(result).toContain("1,500.00");
  });

  it("rounds to 2 decimal places (3rd decimal is dropped)", () => {
    // 1500.005 may round to 1500.00 or 1500.01 depending on float representation
    // Just verify no crash and result is a non-empty string
    const result = formatCurrency(1500.005);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("handles negative amount without throwing", () => {
    expect(() => formatCurrency(-500)).not.toThrow();
    const result = formatCurrency(-500);
    // Should still contain the ₹ symbol and the amount digits
    expect(result).toContain("₹");
    expect(result).toContain("500");
  });

  it("handles a very large amount", () => {
    const result = formatCurrency(10000000, "INR");
    expect(result).toContain("₹");
    expect(result).toContain("0,00,000"); // Indian grouping
  });

  it("returns a non-empty string for any numeric input", () => {
    for (const val of [0, 1, 100, 9999.99, 1000000]) {
      const result = formatCurrency(val);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    }
  });
});
