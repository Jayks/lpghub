import type { OrderStatus } from "@/components/shared/status-badge";

/** Maps each filter pill key to the DB status values it covers. null = no filter. */
export const ORDER_FILTER_GROUPS = {
  all:       null,
  pending:   ["pending_payment", "payment_pending_confirmation"] satisfies OrderStatus[],
  confirmed: ["confirmed"]                                        satisfies OrderStatus[],
  delivery:  ["assigned", "out_for_delivery"]                    satisfies OrderStatus[],
  done:      ["delivered", "cancelled", "rejected"]              satisfies OrderStatus[],
} as const;

export type OrderFilterKey = keyof typeof ORDER_FILTER_GROUPS;

export const ORDER_FILTER_LABELS: Record<OrderFilterKey, string> = {
  all:       "All",
  pending:   "Pending",
  confirmed: "Confirmed",
  delivery:  "Delivery",
  done:      "Done",
};
