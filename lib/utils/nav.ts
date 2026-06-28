/**
 * Determine whether a nav item should be rendered as active.
 *
 * @param pathname  Current pathname from usePathname()
 * @param href      The nav item's href
 * @param exact     If true, only match the exact path (use for Home tabs)
 */
export function isNavItemActive(
  pathname: string,
  href: string,
  exact = false
): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}
