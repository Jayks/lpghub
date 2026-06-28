import { describe, it, expect } from "vitest";
import { formatPhone, isValidIndianPhone } from "./format-phone";

describe("formatPhone", () => {
  describe("10-digit input", () => {
    it("prepends +91 to a plain 10-digit number", () => {
      expect(formatPhone("9876543210")).toBe("+919876543210");
    });

    it("strips spaces before formatting", () => {
      expect(formatPhone("98765 43210")).toBe("+919876543210");
    });

    it("strips hyphens before formatting", () => {
      expect(formatPhone("98765-43210")).toBe("+919876543210");
    });
  });

  describe("already-prefixed input", () => {
    it("leaves +91XXXXXXXXXX unchanged", () => {
      expect(formatPhone("+919876543210")).toBe("+919876543210");
    });

    it("normalises 91XXXXXXXXXX (12 digits, no +) to +91XXXXXXXXXX", () => {
      expect(formatPhone("919876543210")).toBe("+919876543210");
    });

    it("strips spaces from +91 prefixed number", () => {
      expect(formatPhone("+91 98765 43210")).toBe("+919876543210");
    });
  });

  describe("edge cases", () => {
    it("handles all-digit string with country code and spaces", () => {
      expect(formatPhone("91 98765 43210")).toBe("+919876543210");
    });

    it("prepends + for unrecognised digit strings", () => {
      // 8-digit number — falls through to best-effort
      expect(formatPhone("12345678")).toBe("+12345678");
    });
  });
});

describe("isValidIndianPhone", () => {
  it("accepts valid mobile numbers starting with 6-9", () => {
    expect(isValidIndianPhone("+916000000000")).toBe(true);
    expect(isValidIndianPhone("+917000000000")).toBe(true);
    expect(isValidIndianPhone("+918000000000")).toBe(true);
    expect(isValidIndianPhone("+919876543210")).toBe(true);
  });

  it("rejects numbers starting with 0-5 after country code", () => {
    expect(isValidIndianPhone("+915000000000")).toBe(false);
    expect(isValidIndianPhone("+910000000000")).toBe(false);
  });

  it("rejects numbers without +91 prefix", () => {
    expect(isValidIndianPhone("9876543210")).toBe(false);
    expect(isValidIndianPhone("919876543210")).toBe(false);
  });

  it("rejects too-short or too-long numbers", () => {
    expect(isValidIndianPhone("+91987654321")).toBe(false);   // 9 digits
    expect(isValidIndianPhone("+9198765432100")).toBe(false); // 11 digits
  });

  it("rejects non-digit characters after prefix", () => {
    expect(isValidIndianPhone("+91987654321a")).toBe(false);
  });
});

// ─── Additional edge cases ────────────────────────────────────────────────────

describe("formatPhone — additional edge cases", () => {
  it("handles all-zero 10-digit input", () => {
    // Not a valid Indian mobile, but formatPhone normalises any 10-digit string
    expect(formatPhone("0000000000")).toBe("+910000000000");
  });

  it("handles input that starts with 91 and is 12 digits", () => {
    expect(formatPhone("919876543210")).toBe("+919876543210");
  });

  it("strips mixed whitespace and hyphens before formatting", () => {
    expect(formatPhone("98 765-43210")).toBe("+919876543210");
  });

  it("handles empty string without throwing (returns best-effort '+')", () => {
    // Empty string → digits = "" → falls through to `+${digits}` = "+"
    expect(() => formatPhone("")).not.toThrow();
    expect(formatPhone("")).toBe("+");
  });

  it("strips leading/trailing whitespace from a 10-digit number", () => {
    // "  9876543210  " → digits = "9876543210" → "+919876543210"
    expect(formatPhone("  9876543210  ")).toBe("+919876543210");
  });
});

describe("isValidIndianPhone — additional edge cases", () => {
  it("rejects empty string", () => {
    expect(isValidIndianPhone("")).toBe(false);
  });

  it("rejects '+91' with no digits after it", () => {
    expect(isValidIndianPhone("+91")).toBe(false);
  });

  it("rejects a number with spaces inside", () => {
    expect(isValidIndianPhone("+91 9876543210")).toBe(false);
  });

  it("accepts minimum valid mobile starting with 6", () => {
    expect(isValidIndianPhone("+916000000000")).toBe(true);
  });

  it("accepts maximum valid mobile starting with 9", () => {
    expect(isValidIndianPhone("+919999999999")).toBe(true);
  });

  it("rejects null-ish string '  '", () => {
    expect(isValidIndianPhone("  ")).toBe(false);
  });

  it("is case-sensitive for the + prefix", () => {
    // Just digits — no + prefix
    expect(isValidIndianPhone("919876543210")).toBe(false);
  });
});
