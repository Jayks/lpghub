import { describe, it, expect } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("returns a single class unchanged", () => {
    expect(cn("text-red-500")).toBe("text-red-500");
  });

  it("joins multiple classes with a space", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("handles conditional objects — true includes the class", () => {
    expect(cn({ "font-bold": true })).toBe("font-bold");
  });

  it("handles conditional objects — false excludes the class", () => {
    expect(cn({ "font-bold": false })).toBe("");
  });

  it("handles mixed positional and conditional", () => {
    expect(cn("text-sm", { "font-bold": true, italic: false })).toBe(
      "text-sm font-bold"
    );
  });

  it("merges conflicting Tailwind classes — last wins", () => {
    // twMerge should keep only px-4
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("merges conflicting text-color classes — last wins", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("merges conflicting bg-color classes", () => {
    expect(cn("bg-white", "bg-slate-900")).toBe("bg-slate-900");
  });

  it("handles arrays of classes", () => {
    const result = cn(["px-4", "py-2"]);
    expect(result).toContain("px-4");
    expect(result).toContain("py-2");
  });

  it("ignores undefined values", () => {
    expect(cn("text-sm", undefined, "font-bold")).toBe("text-sm font-bold");
  });

  it("ignores null values", () => {
    expect(cn("text-sm", null, "font-bold")).toBe("text-sm font-bold");
  });

  it("ignores empty strings", () => {
    expect(cn("", "text-sm", "")).toBe("text-sm");
  });

  it("returns empty string when called with no args", () => {
    expect(cn()).toBe("");
  });

  it("returns empty string for all-falsy input", () => {
    expect(cn(null, undefined, false as unknown as string)).toBe("");
  });

  it("handles dark mode variant classes without merging them", () => {
    // dark: prefix is a variant — both should coexist
    const result = cn("text-slate-900", "dark:text-white");
    expect(result).toContain("text-slate-900");
    expect(result).toContain("dark:text-white");
  });

  it("merges responsive variants correctly", () => {
    // sm: prefix is a variant — sm:px-4 beats sm:px-2
    const result = cn("sm:px-2", "sm:px-4");
    expect(result).toBe("sm:px-4");
  });
});
