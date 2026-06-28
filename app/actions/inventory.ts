"use server";

import { revalidatePath } from "next/cache";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, sql } from "drizzle-orm";
import pgClient from "@/lib/db/client";
import { inventory, inventoryAdjustments } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/db/queries/auth";
import { adjustStockSchema, adjustmentLabel } from "@/lib/schemas/inventory";
import type { AdjustStockInput } from "@/lib/schemas/inventory";
import { computeStockAdjustment } from "@/lib/inventory/compute";

export type { AdjustStockInput } from "@/lib/schemas/inventory";

const db = drizzle(pgClient);

export async function adjustInventoryAction(
  input: AdjustStockInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return { ok: false, error: "Unauthorized" };

  const parsed = adjustStockSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const { cylinderTypeId, inventoryId, qty, mode, reduceType } = parsed.data;

  try {
    const [row] = await db
      .select({
        availableStock: inventory.availableStock,
        totalStock: inventory.totalStock,
        reservedStock: inventory.reservedStock,
        deliveredStock: inventory.deliveredStock,
      })
      .from(inventory)
      .where(eq(inventory.id, inventoryId));

    if (!row) return { ok: false, error: "Inventory record not found." };

    const result = computeStockAdjustment(row, { mode, qty, reduceType });
    if (!result.ok) return { ok: false, error: result.error };

    const { next, delta } = result;

    await db
      .update(inventory)
      .set({
        availableStock: next.availableStock,
        totalStock:     next.totalStock,
        reservedStock:  next.reservedStock,
        deliveredStock: next.deliveredStock,
        updatedAt: sql`now()`,
      })
      .where(eq(inventory.id, inventoryId));

    await db.insert(inventoryAdjustments).values({
      cylinderTypeId,
      delta,
      reason: adjustmentLabel(parsed.data),
      adjustedBy: user.id,
    });

    revalidatePath("/admin/inventory");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    console.error("[adjustInventoryAction]", e);
    return { ok: false, error: "Failed to adjust stock. Please try again." };
  }
}
