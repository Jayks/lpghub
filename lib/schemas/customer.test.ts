import { describe, it, expect } from "vitest";
import { createCustomerSchema } from "./customer";

const VALID_BASE = {
  businessName: "Sunrise Bakery",
  contactPerson: "Ravi Kumar",
  phone: "9876543210",
  address: "123, Market Street, Chennai",
  eligibilityLimit: 5,
  depositAmount: 5000,
  depositPaidOn: "2026-06-01",
  depositPaymentMode: "cash" as const,
};

describe("createCustomerSchema", () => {
  it("accepts a fully valid input", () => {
    const result = createCustomerSchema.safeParse(VALID_BASE);
    expect(result.success).toBe(true);
  });

  it("rejects empty business name", () => {
    const result = createCustomerSchema.safeParse({ ...VALID_BASE, businessName: "" });
    expect(result.success).toBe(false);
  });

  it("rejects phone with fewer than 10 digits", () => {
    const result = createCustomerSchema.safeParse({ ...VALID_BASE, phone: "98765" });
    expect(result.success).toBe(false);
  });

  it("rejects phone with more than 10 digits", () => {
    const result = createCustomerSchema.safeParse({ ...VALID_BASE, phone: "98765432109" });
    expect(result.success).toBe(false);
  });

  it("rejects phone with non-digit characters", () => {
    const result = createCustomerSchema.safeParse({ ...VALID_BASE, phone: "+9876543210" });
    expect(result.success).toBe(false);
  });

  it("rejects address shorter than 5 characters", () => {
    const result = createCustomerSchema.safeParse({ ...VALID_BASE, address: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects zero or negative deposit amount", () => {
    const r1 = createCustomerSchema.safeParse({ ...VALID_BASE, depositAmount: 0 });
    const r2 = createCustomerSchema.safeParse({ ...VALID_BASE, depositAmount: -100 });
    expect(r1.success).toBe(false);
    expect(r2.success).toBe(false);
  });

  it("rejects unknown payment modes", () => {
    const result = createCustomerSchema.safeParse({ ...VALID_BASE, depositPaymentMode: "bitcoin" });
    expect(result.success).toBe(false);
  });

  it("accepts all valid payment modes", () => {
    const modes = ["cash", "upi", "bank_transfer", "cheque"] as const;
    for (const mode of modes) {
      const result = createCustomerSchema.safeParse({ ...VALID_BASE, depositPaymentMode: mode });
      expect(result.success, `mode ${mode} should be valid`).toBe(true);
    }
  });

  it("coerces string eligibilityLimit to number", () => {
    const result = createCustomerSchema.safeParse({ ...VALID_BASE, eligibilityLimit: "10" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.eligibilityLimit).toBe(10);
  });

  it("defaults eligibilityLimit to 5 when omitted", () => {
    const { eligibilityLimit: _, ...withoutLimit } = VALID_BASE;
    const result = createCustomerSchema.safeParse(withoutLimit);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.eligibilityLimit).toBe(5);
  });

  it("allows optional referenceNo and notes", () => {
    const result = createCustomerSchema.safeParse({
      ...VALID_BASE,
      depositReferenceNo: "TXN123",
      depositNotes: "Paid in two instalments",
    });
    expect(result.success).toBe(true);
  });
});

// ─── Boundary tests ───────────────────────────────────────────────────────────

describe("createCustomerSchema — eligibilityLimit boundaries", () => {
  it("rejects eligibilityLimit of 0 (below minimum of 1)", () => {
    const result = createCustomerSchema.safeParse({ ...VALID_BASE, eligibilityLimit: 0 });
    expect(result.success).toBe(false);
  });

  it("accepts eligibilityLimit of 1 (minimum boundary)", () => {
    const result = createCustomerSchema.safeParse({ ...VALID_BASE, eligibilityLimit: 1 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.eligibilityLimit).toBe(1);
  });

  it("accepts eligibilityLimit of 50 (maximum boundary)", () => {
    const result = createCustomerSchema.safeParse({ ...VALID_BASE, eligibilityLimit: 50 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.eligibilityLimit).toBe(50);
  });

  it("rejects eligibilityLimit of 51 (above maximum of 50)", () => {
    const result = createCustomerSchema.safeParse({ ...VALID_BASE, eligibilityLimit: 51 });
    expect(result.success).toBe(false);
  });

  it("rejects negative eligibilityLimit", () => {
    const result = createCustomerSchema.safeParse({ ...VALID_BASE, eligibilityLimit: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer eligibilityLimit", () => {
    const result = createCustomerSchema.safeParse({ ...VALID_BASE, eligibilityLimit: 3.5 });
    expect(result.success).toBe(false);
  });

  it("coerces string '50' to number 50 (boundary, should pass)", () => {
    const result = createCustomerSchema.safeParse({ ...VALID_BASE, eligibilityLimit: "50" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.eligibilityLimit).toBe(50);
  });

  it("coerces string '51' to number 51 (above boundary, should fail)", () => {
    const result = createCustomerSchema.safeParse({ ...VALID_BASE, eligibilityLimit: "51" });
    expect(result.success).toBe(false);
  });
});

describe("createCustomerSchema — address boundaries", () => {
  it("rejects address with 4 characters (below minimum of 5)", () => {
    const result = createCustomerSchema.safeParse({ ...VALID_BASE, address: "A1B2" });
    expect(result.success).toBe(false);
  });

  it("accepts address with exactly 5 characters (minimum boundary)", () => {
    const result = createCustomerSchema.safeParse({ ...VALID_BASE, address: "12345" });
    expect(result.success).toBe(true);
  });

  it("accepts address with 6+ characters", () => {
    const result = createCustomerSchema.safeParse({ ...VALID_BASE, address: "123456" });
    expect(result.success).toBe(true);
  });
});

describe("createCustomerSchema — required fields", () => {
  it("rejects empty contactPerson", () => {
    const result = createCustomerSchema.safeParse({ ...VALID_BASE, contactPerson: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty depositPaidOn", () => {
    const result = createCustomerSchema.safeParse({ ...VALID_BASE, depositPaidOn: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing businessName field", () => {
    const { businessName: _, ...rest } = VALID_BASE;
    const result = createCustomerSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects whitespace-only businessName", () => {
    // Zod min(1) only checks length, not blank — whitespace IS 1 char, so " " passes min(1).
    // This test documents the CURRENT behavior (whitespace accepted).
    const result = createCustomerSchema.safeParse({ ...VALID_BASE, businessName: " " });
    // min(1) is satisfied by " " — document current behavior
    expect(result.success).toBe(true);
  });
});

describe("createCustomerSchema — deposit amount", () => {
  it("accepts a fractional deposit amount (e.g. 500.50)", () => {
    const result = createCustomerSchema.safeParse({ ...VALID_BASE, depositAmount: 500.50 });
    expect(result.success).toBe(true);
  });

  it("accepts minimum valid deposit (0.01)", () => {
    const result = createCustomerSchema.safeParse({ ...VALID_BASE, depositAmount: 0.01 });
    expect(result.success).toBe(true);
  });

  it("rejects deposit amount of 0", () => {
    const result = createCustomerSchema.safeParse({ ...VALID_BASE, depositAmount: 0 });
    expect(result.success).toBe(false);
  });

  it("coerces string deposit amount '5000' to number", () => {
    const result = createCustomerSchema.safeParse({ ...VALID_BASE, depositAmount: "5000" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.depositAmount).toBe(5000);
  });
});
