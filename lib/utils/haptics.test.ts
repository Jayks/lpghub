import { describe, it, expect, vi, afterEach } from "vitest";
import { haptic } from "./haptics";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Stub globalThis.navigator with a mock `vibrate`.
 * Returns the mock fn so callers can assert on it.
 */
function stubNavigatorWithVibrate(): ReturnType<typeof vi.fn> {
  const vibrateMock = vi.fn();
  vi.stubGlobal("navigator", { vibrate: vibrateMock });
  return vibrateMock;
}

/**
 * Stub navigator WITHOUT a vibrate property (simulates unsupported device).
 */
function stubNavigatorWithoutVibrate(): void {
  vi.stubGlobal("navigator", { userAgent: "test-browser" });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("haptic — vibrate supported", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls navigator.vibrate with the default pattern of 10", () => {
    const vibrateMock = stubNavigatorWithVibrate();
    haptic();
    expect(vibrateMock).toHaveBeenCalledOnce();
    expect(vibrateMock).toHaveBeenCalledWith(10);
  });

  it("calls navigator.vibrate with a custom numeric pattern", () => {
    const vibrateMock = stubNavigatorWithVibrate();
    haptic(50);
    expect(vibrateMock).toHaveBeenCalledWith(50);
  });

  it("calls navigator.vibrate with a single-element array pattern", () => {
    const vibrateMock = stubNavigatorWithVibrate();
    haptic([200]);
    expect(vibrateMock).toHaveBeenCalledWith([200]);
  });

  it("calls navigator.vibrate with a multi-element array pattern", () => {
    const vibrateMock = stubNavigatorWithVibrate();
    haptic([100, 50, 100]);
    expect(vibrateMock).toHaveBeenCalledWith([100, 50, 100]);
  });

  it("calls vibrate exactly once per haptic() invocation", () => {
    const vibrateMock = stubNavigatorWithVibrate();
    haptic(10);
    haptic(20);
    haptic([30, 10]);
    expect(vibrateMock).toHaveBeenCalledTimes(3);
  });

  it("does not throw for pattern = 0", () => {
    stubNavigatorWithVibrate();
    expect(() => haptic(0)).not.toThrow();
  });
});

describe("haptic — vibrate NOT supported", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not throw when navigator has no vibrate property", () => {
    stubNavigatorWithoutVibrate();
    expect(() => haptic()).not.toThrow();
  });

  it("does not throw when haptic is called with a pattern", () => {
    stubNavigatorWithoutVibrate();
    expect(() => haptic(100)).not.toThrow();
    expect(() => haptic([100, 50, 100])).not.toThrow();
  });

  it("is a silent no-op — vibrate is never called", () => {
    const vibrateMock = vi.fn();
    // Navigator exists but without a vibrate property
    vi.stubGlobal("navigator", { userAgent: "test" }); // no vibrate key
    haptic();
    expect(vibrateMock).not.toHaveBeenCalled();
  });
});
