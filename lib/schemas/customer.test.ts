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
