import { describe, it, expect } from "vitest";
import { parseOrderSearch } from "./parse-order-search";

describe("parseOrderSearch", () => {
  // ── empty / whitespace ────────────────────────────────────────────────────

  it("returns empty term and null orderNumber for empty string", () => {
    expect(parseOrderSearch("")).toEqual({ term: "", orderNumber: null });
  });

  it("returns empty term and null orderNumber for whitespace-only string", () => {
    expect(parseOrderSearch("   ")).toEqual({ term: "", orderNumber: null });
  });

  // ── plain number ──────────────────────────────────────────────────────────

  it("extracts orderNumber from a plain numeric string", () => {
    expect(parseOrderSearch("42")).toEqual({ term: "42", orderNumber: 42 });
  });

  it("extracts orderNumber from a single digit", () => {
    expect(parseOrderSearch("1")).toEqual({ term: "1", orderNumber: 1 });
  });

  it("extracts orderNumber from a large number", () => {
    expect(parseOrderSearch("1042")).toEqual({ term: "1042", orderNumber: 1042 });
  });

  // ── ORD- prefix variants ──────────────────────────────────────────────────

  it("strips 'ORD-' prefix (upper) and extracts orderNumber", () => {
    expect(parseOrderSearch("ORD-42")).toEqual({ term: "ORD-42", orderNumber: 42 });
  });

  it("strips 'ord-' prefix (lower) and extracts orderNumber", () => {
    expect(parseOrderSearch("ord-42")).toEqual({ term: "ord-42", orderNumber: 42 });
  });

  it("strips 'Ord-' prefix (mixed case) and extracts orderNumber", () => {
    expect(parseOrderSearch("Ord-7")).toEqual({ term: "Ord-7", orderNumber: 7 });
  });

  it("strips 'ORD' prefix (no hyphen) and extracts orderNumber", () => {
    expect(parseOrderSearch("ORD42")).toEqual({ term: "ORD42", orderNumber: 42 });
  });

  // ── plain text (business name search) ────────────────────────────────────

  it("returns null orderNumber for a business name", () => {
    expect(parseOrderSearch("Sunrise Bakery")).toEqual({
      term: "Sunrise Bakery",
      orderNumber: null,
    });
  });

  it("trims whitespace from business name query", () => {
    expect(parseOrderSearch("  Sunrise  ")).toEqual({
      term: "Sunrise",
      orderNumber: null,
    });
  });

  // ── edge cases ────────────────────────────────────────────────────────────

  it("treats 'ORD-' with no number as a plain text search", () => {
    const result = parseOrderSearch("ORD-");
    expect(result.orderNumber).toBeNull();
    expect(result.term).toBe("ORD-");
  });

  it("treats mixed alphanumeric as plain text (e.g. 'ORD-42abc')", () => {
    const result = parseOrderSearch("ORD-42abc");
    expect(result.orderNumber).toBeNull();
  });

  it("preserves original term even when orderNumber is extracted", () => {
    const { term } = parseOrderSearch("ORD-5");
    expect(term).toBe("ORD-5"); // original, not stripped
  });
});
