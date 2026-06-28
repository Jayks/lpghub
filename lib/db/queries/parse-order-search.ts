/**
 * Parses a raw search string into structured order-search parameters.
 * Pure function — no DB calls, safe to unit test.
 */
export interface OrderSearchParams {
  /** Trimmed search term (may be empty string) */
  term: string;
  /** When the term looks like a number or "ORD-N", the extracted order number */
  orderNumber: number | null;
}

export function parseOrderSearch(raw: string): OrderSearchParams {
  const term = raw.trim();

  if (!term) return { term: "", orderNumber: null };

  // Strip optional "ORD-" prefix (case-insensitive), then check for digits-only
  const stripped = term.replace(/^ord-?/i, "");
  if (/^\d+$/.test(stripped)) {
    return { term, orderNumber: parseInt(stripped, 10) };
  }

  return { term, orderNumber: null };
}
