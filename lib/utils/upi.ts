/**
 * Build a UPI payment intent deep link.
 *
 * Spec: upi://pay?pa={VPA}&pn={MERCHANT_NAME}&am={AMOUNT}&tr={ORDER_ID}&tn={NOTE}&cu=INR
 *
 * All parameter values are URL-encoded by URLSearchParams.
 * Note: URLSearchParams encodes spaces as `+`, which is valid in URL query strings
 * and handled correctly by all major UPI apps.
 */
export interface UpiLinkParams {
  /** Payee VPA (Virtual Payment Address), e.g. "agency@okicici" */
  vpa: string;
  /** Display name shown in the UPI payment app */
  merchantName: string;
  /** Amount as a decimal string with exactly 2 decimal places, e.g. "1500.00" */
  amount: string;
  /** Transaction reference — the internal order ID for reconciliation */
  orderId: string;
  /** Short note displayed in the UPI app (default: "LPGHub Order") */
  note?: string;
}

/**
 * Build a `upi://pay?…` deep link from the given parameters.
 *
 * Pure function — no side effects, no env reads.
 * The caller is responsible for passing the correct VPA and merchant name
 * (typically from environment variables).
 */
export function buildUpiLink({
  vpa,
  merchantName,
  amount,
  orderId,
  note = "LPGHub Order",
}: UpiLinkParams): string {
  const params = new URLSearchParams({
    pa: vpa,
    pn: merchantName,
    am: amount,
    tr: orderId,
    tn: note,
    cu: "INR",
  });
  return `upi://pay?${params.toString()}`;
}
