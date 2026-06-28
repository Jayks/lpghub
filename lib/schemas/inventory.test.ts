import { describe, it, expect } from "vitest";
import { adjustStockSchema, adjustmentLabel } from "./inventory";
import type { AdjustStockInput } from "./inventory";

// Valid RFC 4122 UUIDs (Zod v4 checks version & variant bits)
const VALID_IDS = {
  cylinderTypeId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  inventoryId:    "550e8400-e29b-41d4-a716-446655440000",
};

// ─── adjustStockSchema — add mode ────────────────────────────────────────────

describe("adjustStockSchema — add mode", () => {
  it("accepts valid add input", () => {
    const result = adjustStockSchema.safeParse({ ...VALID_IDS, qty: 10, mode: "add" });
    expect(result.success, !result.success ? JSON.stringify(result.error.issues) : "").toBe(true);
  });

  it("rejects zero quantity", () => {
    const result = adjustStockSchema.safeParse({ ...VALID_IDS, qty: 0, mode: "add" });
    expect(result.success).toBe(false);
  });

  it("rejects negative quantity", () => {
    const result = adjustStockSchema.safeParse({ ...VALID_IDS, qty: -5, mode: "add" });
    expect(result.success).toBe(false);
  });

  it("coerces string qty to number", () => {
    const result = adjustStockSchema.safeParse({ ...VALID_IDS, qty: "20", mode: "add" });
    expect(result.success, !result.success ? JSON.stringify(result.error.issues) : "").toBe(true);
    if (result.success) expect(result.data.qty).toBe(20);
  });

  it("accepts an optional note", () => {
    const result = adjustStockSchema.safeParse({ ...VALID_IDS, qty: 5, mode: "add", reason: "Supplier delivery" });
    expect(result.success).toBe(true);
  });
});

// ─── adjustStockSchema — reduce mode ─────────────────────────────────────────

describe("adjustStockSchema — reduce mode", () => {
  it("rejects reduce without a reduceType", () => {
    const result = adjustStockSchema.safeParse({ ...VALID_IDS, qty: 5, mode: "reduce" });
    expect(result.success).toBe(false);
  });

  it("accepts reduce with delivered", () => {
    const result = adjustStockSchema.safeParse({ ...VALID_IDS, qty: 5, mode: "reduce", reduceType: "delivered" });
    expect(result.success, !result.success ? JSON.stringify(result.error.issues) : "").toBe(true);
  });

  it("accepts reduce with reserved", () => {
    const result = adjustStockSchema.safeParse({ ...VALID_IDS, qty: 3, mode: "reduce", reduceType: "reserved" });
    expect(result.success, !result.success ? JSON.stringify(result.error.issues) : "").toBe(true);
  });

  it("accepts reduce with damaged", () => {
    const result = adjustStockSchema.safeParse({ ...VALID_IDS, qty: 1, mode: "reduce", reduceType: "damaged" });
    expect(result.success, !result.success ? JSON.stringify(result.error.issues) : "").toBe(true);
  });

  it("rejects reduce/other without a reason", () => {
    const result = adjustStockSchema.safeParse({ ...VALID_IDS, qty: 2, mode: "reduce", reduceType: "other" });
    expect(result.success).toBe(false);
  });

  it("rejects reduce/other with a reason shorter than 3 chars", () => {
    const result = adjustStockSchema.safeParse({ ...VALID_IDS, qty: 2, mode: "reduce", reduceType: "other", reason: "ok" });
    expect(result.success).toBe(false);
  });

  it("accepts reduce/other with a valid reason", () => {
    const result = adjustStockSchema.safeParse({ ...VALID_IDS, qty: 2, mode: "reduce", reduceType: "other", reason: "Returned to supplier" });
    expect(result.success, !result.success ? JSON.stringify(result.error.issues) : "").toBe(true);
  });

  it("rejects an unknown reduceType", () => {
    const result = adjustStockSchema.safeParse({ ...VALID_IDS, qty: 2, mode: "reduce", reduceType: "stolen" });
    expect(result.success).toBe(false);
  });
});

// ─── adjustmentLabel ──────────────────────────────────────────────────────────

describe("adjustmentLabel", () => {
  const base = { ...VALID_IDS, qty: 5 };

  it("returns custom note for add when provided", () => {
    const input: AdjustStockInput = { ...base, mode: "add", reason: "Supplier delivery" };
    expect(adjustmentLabel(input)).toBe("Supplier delivery");
  });

  it("defaults to 'New stock arrival' for add without note", () => {
    const input: AdjustStockInput = { ...base, mode: "add" };
    expect(adjustmentLabel(input)).toBe("New stock arrival");
  });

  it("labels delivered reductions correctly", () => {
    const input: AdjustStockInput = { ...base, mode: "reduce", reduceType: "delivered" };
    expect(adjustmentLabel(input)).toBe("Delivered (manual, outside order)");
  });

  it("labels reserved reductions correctly", () => {
    const input: AdjustStockInput = { ...base, mode: "reduce", reduceType: "reserved" };
    expect(adjustmentLabel(input)).toBe("Set aside / Reserved");
  });

  it("labels damaged reductions correctly", () => {
    const input: AdjustStockInput = { ...base, mode: "reduce", reduceType: "damaged" };
    expect(adjustmentLabel(input)).toBe("Damaged / Lost");
  });

  it("uses the reason text for other reductions", () => {
    const input: AdjustStockInput = { ...base, mode: "reduce", reduceType: "other", reason: "Sent for repair" };
    expect(adjustmentLabel(input)).toBe("Sent for repair");
  });

  it("falls back gracefully when other has no reason", () => {
    const input: AdjustStockInput = { ...base, mode: "reduce", reduceType: "other" };
    expect(adjustmentLabel(input)).toBe("Manual adjustment");
  });
});
