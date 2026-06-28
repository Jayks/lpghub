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
