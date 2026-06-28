import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { formatDate, formatDateTime, formatRelative } from "./format-date";

// Fix timezone so date-fns format calls produce consistent output in CI
// date-fns reads the system locale for formatting — we pin to a known date.
const FIXED_DATE   = new Date("2026-06-15T10:30:00.000Z");
const FIXED_DATE_2 = new Date("2025-01-01T00:00:00.000Z");

describe("formatDate", () => {
  it("formats a Date object as 'd MMM yyyy'", () => {
    const result = formatDate(FIXED_DATE);
    // Exact string depends on local TZ offset; check the shape instead
    expect(result).toMatch(/^\d{1,2} [A-Z][a-z]{2} \d{4}$/);
  });

  it("formats an ISO string", () => {
    const result = formatDate("2026-06-15");
    expect(result).toMatch(/^\d{1,2} [A-Z][a-z]{2} 2026$/);
  });

  it("includes the correct year", () => {
    expect(formatDate("2025-01-01")).toContain("2025");
  });

  it("includes the correct month abbreviation", () => {
    expect(formatDate("2026-06-15")).toContain("Jun");
  });

  it("formats January correctly", () => {
    const result = formatDate(FIXED_DATE_2);
    expect(result).toContain("Jan");
    expect(result).toContain("2025");
  });

  it("formats December correctly", () => {
    expect(formatDate("2025-12-25")).toContain("Dec");
  });
});

describe("formatDateTime", () => {
  it("returns a string containing the year", () => {
    expect(formatDateTime(FIXED_DATE)).toContain("2026");
  });

  it("includes AM or PM", () => {
    const result = formatDateTime(FIXED_DATE);
    expect(result).toMatch(/AM|PM/);
  });

  it("formats an ISO string input", () => {
    const result = formatDateTime("2026-01-15T14:00:00.000Z");
    expect(result).toContain("Jan");
    expect(result).toContain("2026");
  });
});

describe("formatRelative", () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-27T12:00:00.000Z"));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it("describes a recent past date", () => {
    const fiveMinAgo = new Date("2026-06-27T11:55:00.000Z");
    const result = formatRelative(fiveMinAgo);
    expect(result).toMatch(/minutes? ago/i);
  });

  it("describes a date from yesterday-ish", () => {
    const yesterday = new Date("2026-06-26T12:00:00.000Z");
    const result = formatRelative(yesterday);
    expect(result).toMatch(/day|hour/i);
  });

  it("describes a date from last month", () => {
    const lastMonth = new Date("2026-05-27T12:00:00.000Z");
    const result = formatRelative(lastMonth);
    expect(result).toMatch(/month/i);
  });

  it("includes 'ago' suffix", () => {
    const past = new Date("2026-06-27T11:00:00.000Z");
    expect(formatRelative(past)).toMatch(/ago/i);
  });

  it("accepts an ISO string input", () => {
    const result = formatRelative("2026-06-27T11:55:00.000Z");
    expect(result).toMatch(/ago/i);
  });
});
