/**
 * Pure helper for computing inventory bar segment widths and label visibility.
 * No DB calls — safe to unit test.
 */

/** Minimum segment width (as % of total) required to show the count label inside */
export const LABEL_MIN_PCT = 12;

export interface InventorySegment {
  count: number;
  /** 0–100, rounded to nearest integer */
  pct: number;
  /** true when the segment is wide enough to render the count inside */
  showLabel: boolean;
}

export interface InventoryBar {
  available: InventorySegment;
  reserved: InventorySegment;
  delivered: InventorySegment;
  total: number;
}

export function computeInventoryBar(
  total: number,
  available: number,
  reserved: number,
  delivered: number
): InventoryBar {
  const empty: InventorySegment = { count: 0, pct: 0, showLabel: false };

  if (total === 0) {
    return { available: empty, reserved: empty, delivered: empty, total: 0 };
  }

  const seg = (n: number): InventorySegment => {
    const pct = Math.round((n / total) * 100);
    return { count: n, pct, showLabel: pct >= LABEL_MIN_PCT };
  };

  return {
    available: seg(available),
    reserved:  seg(reserved),
    delivered: seg(delivered),
    total,
  };
}
