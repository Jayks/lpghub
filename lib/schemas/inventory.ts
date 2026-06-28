import { z } from "zod";

export const REDUCE_TYPES = ["delivered", "reserved", "damaged", "other"] as const;
export type ReduceType = typeof REDUCE_TYPES[number];

export const adjustStockSchema = z.object({
  cylinderTypeId: z.string().uuid("Invalid cylinder type"),
  inventoryId: z.string().uuid("Invalid inventory record"),
  qty: z.coerce.number().int().positive("Enter a valid quantity"),
  mode: z.enum(["add", "reduce"]),
  reduceType: z.enum(REDUCE_TYPES).optional(),
  reason: z.string().optional(),
}).refine(
  (d) => !(d.mode === "reduce" && !d.reduceType),
  { message: "Select a reason for reducing stock", path: ["reduceType"] }
).refine(
  (d) => !(d.mode === "reduce" && d.reduceType === "other" && (d.reason ?? "").trim().length < 3),
  { message: "Enter a reason (min 3 characters)", path: ["reason"] }
);

export type AdjustStockInput = z.infer<typeof adjustStockSchema>;

/** Human-readable label stored in adjustment log */
export function adjustmentLabel(input: AdjustStockInput): string {
  if (input.mode === "add") return input.reason?.trim() || "New stock arrival";
  if (input.reduceType === "delivered") return "Delivered (manual, outside order)";
  if (input.reduceType === "reserved") return "Set aside / Reserved";
  if (input.reduceType === "damaged") return "Damaged / Lost";
  return input.reason?.trim() || "Manual adjustment";
}
