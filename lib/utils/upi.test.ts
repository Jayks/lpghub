import { describe, it, expect } from "vitest";
import { buildUpiLink } from "./upi";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const VALID_PARAMS = {
  vpa: "agency@okicici",
  merchantName: "LPGHub Agency",
  amount: "1500.00",
  orderId: "order-uuid-abc-123",
};

// Helper: parse query string from a upi:// URL
function parseUpiParams(url: string): URLSearchParams {
  const qs = url.split("?")[1] ?? "";
  return new URLSearchParams(qs);
}

// ─── URL structure ────────────────────────────────────────────────────────────

describe("buildUpiLink — URL structure", () => {
  it("returns a string starting with upi://pay?", () => {
    const url = buildUpiLink(VALID_PARAMS);
    expect(url).toMatch(/^upi:\/\/pay\?/);
  });

  it("contains a non-empty query string after the ?", () => {
    const url = buildUpiLink(VALID_PARAMS);
    const qs = url.split("?")[1] ?? "";
    expect(qs.length).toBeGreaterThan(0);
  });

  it("includes all 6 required UPI parameters", () => {
    const params = parseUpiParams(buildUpiLink(VALID_PARAMS));
    expect(params.has("pa")).toBe(true);  // payee VPA
    expect(params.has("pn")).toBe(true);  // payee name
    expect(params.has("am")).toBe(true);  // amount
    expect(params.has("tr")).toBe(true);  // transaction reference
    expect(params.has("tn")).toBe(true);  // note
    expect(params.has("cu")).toBe(true);  // currency
  });
});

// ─── Parameter values ─────────────────────────────────────────────────────────

describe("buildUpiLink — parameter values", () => {
  it("sets pa to the provided VPA", () => {
    const params = parseUpiParams(buildUpiLink(VALID_PARAMS));
    expect(params.get("pa")).toBe("agency@okicici");
  });

  it("sets pn to the merchant name", () => {
    const params = parseUpiParams(buildUpiLink(VALID_PARAMS));
    expect(params.get("pn")).toBe("LPGHub Agency");
  });

  it("sets am to the provided amount string", () => {
    const params = parseUpiParams(buildUpiLink(VALID_PARAMS));
    expect(params.get("am")).toBe("1500.00");
  });

  it("sets tr to the orderId (transaction reference)", () => {
    const params = parseUpiParams(buildUpiLink(VALID_PARAMS));
    expect(params.get("tr")).toBe("order-uuid-abc-123");
  });

  it("sets cu to INR", () => {
    const params = parseUpiParams(buildUpiLink(VALID_PARAMS));
    expect(params.get("cu")).toBe("INR");
  });

  it("uses 'LPGHub Order' as the default note (tn)", () => {
    const params = parseUpiParams(buildUpiLink(VALID_PARAMS));
    expect(params.get("tn")).toBe("LPGHub Order");
  });

  it("uses a custom note when provided", () => {
    const params = parseUpiParams(
      buildUpiLink({ ...VALID_PARAMS, note: "Cylinder Booking #42" })
    );
    expect(params.get("tn")).toBe("Cylinder Booking #42");
  });
});

// ─── Round-trip integrity ─────────────────────────────────────────────────────

describe("buildUpiLink — round-trip integrity", () => {
  it("round-trips VPA with @ symbol correctly", () => {
    const params = parseUpiParams(
      buildUpiLink({ ...VALID_PARAMS, vpa: "merchant@paytm" })
    );
    expect(params.get("pa")).toBe("merchant@paytm");
  });

  it("round-trips a UUID order ID", () => {
    const uuid = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
    const params = parseUpiParams(
      buildUpiLink({ ...VALID_PARAMS, orderId: uuid })
    );
    expect(params.get("tr")).toBe(uuid);
  });

  it("round-trips amount with two decimal places", () => {
    const params = parseUpiParams(
      buildUpiLink({ ...VALID_PARAMS, amount: "250.50" })
    );
    expect(params.get("am")).toBe("250.50");
  });

  it("round-trips amount for zero (0.00)", () => {
    const params = parseUpiParams(
      buildUpiLink({ ...VALID_PARAMS, amount: "0.00" })
    );
    expect(params.get("am")).toBe("0.00");
  });

  it("round-trips merchant name containing spaces", () => {
    const params = parseUpiParams(
      buildUpiLink({ ...VALID_PARAMS, merchantName: "My Gas Agency" })
    );
    expect(params.get("pn")).toBe("My Gas Agency");
  });
});

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe("buildUpiLink — edge cases", () => {
  it("handles a large amount", () => {
    const params = parseUpiParams(
      buildUpiLink({ ...VALID_PARAMS, amount: "99999.99" })
    );
    expect(params.get("am")).toBe("99999.99");
  });

  it("handles different UPI providers in the VPA", () => {
    const vpas = [
      "agency@ybl",
      "agency@upi",
      "agency@okicici",
      "agency@oksbi",
      "agency@okhdfcbank",
    ];
    for (const vpa of vpas) {
      const params = parseUpiParams(buildUpiLink({ ...VALID_PARAMS, vpa }));
      expect(params.get("pa")).toBe(vpa);
    }
  });

  it("does not throw for any combination of valid inputs", () => {
    expect(() =>
      buildUpiLink({
        vpa: "x@y",
        merchantName: "A",
        amount: "1.00",
        orderId: "id",
        note: "note",
      })
    ).not.toThrow();
  });
});
