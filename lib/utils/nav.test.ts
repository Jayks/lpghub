import { describe, it, expect } from "vitest";
import { isNavItemActive } from "./nav";

describe("isNavItemActive", () => {
  // Exact mode (used for Home tabs)
  it("exact: matches exactly", () => {
    expect(isNavItemActive("/", "/", true)).toBe(true);
    expect(isNavItemActive("/admin", "/admin", true)).toBe(true);
  });

  it("exact: does not match child path", () => {
    expect(isNavItemActive("/admin/customers", "/admin", true)).toBe(false);
    expect(isNavItemActive("/orders/123", "/", true)).toBe(false);
  });

  // Prefix mode (default — used for all other tabs)
  it("prefix: matches own path", () => {
    expect(isNavItemActive("/admin/customers", "/admin/customers")).toBe(true);
  });

  it("prefix: matches child path", () => {
    expect(isNavItemActive("/admin/customers/abc", "/admin/customers")).toBe(true);
    expect(isNavItemActive("/orders/new", "/orders")).toBe(true);
  });

  it("prefix: does not match sibling path", () => {
    expect(isNavItemActive("/admin/orders", "/admin/customers")).toBe(false);
  });

  it("prefix: does not match partial segment", () => {
    // /admin/customersbad must NOT match /admin/customers
    expect(isNavItemActive("/admin/customersbad", "/admin/customers")).toBe(false);
  });
});
