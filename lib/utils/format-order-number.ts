/**
 * Format an order number as a human-readable string for display and phone communication.
 * e.g. 1001 → "ORD-1001"
 */
export function formatOrderNumber(orderNumber: number): string {
  return `ORD-${orderNumber}`;
}
