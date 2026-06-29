import { desc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { drizzle } from "drizzle-orm/postgres-js";
import pgClient from "@/lib/db/client";
import { cylinderTypes, inventory, inventoryAdjustments } from "@/lib/db/schema";

const db = drizzle(pgClient);

export type InventoryRow = {
  inventoryId: string;
  cylinderTypeId: string;
  label: string;
  unitPrice: string;
  totalStock: number;
  availableStock: number;
  reservedStock: number;
  deliveredStock: number;
  updatedAt: Date | null;
};

export type AdjustmentRow = {
  id: string;
  label: string;
  delta: number;
  reason: string;
  adjustedAt: Date | null;
};

// Cached — invalidated by adjustInventory, createOrder, cancelOrder,
// rejectPayment, and markDelivered via revalidateTag("inventory").
export const getInventoryWithTypes = unstable_cache(
  async (): Promise<InventoryRow[]> =>
    db
      .select({
        inventoryId:    inventory.id,
        cylinderTypeId: inventory.cylinderTypeId,
        label:          cylinderTypes.label,
        unitPrice:      cylinderTypes.unitPrice,
        totalStock:     inventory.totalStock,
        availableStock: inventory.availableStock,
        reservedStock:  inventory.reservedStock,
        deliveredStock: inventory.deliveredStock,
        updatedAt:      inventory.updatedAt,
      })
      .from(inventory)
      .innerJoin(cylinderTypes, eq(inventory.cylinderTypeId, cylinderTypes.id))
      .orderBy(cylinderTypes.label),
  ["inventory"],
  { tags: ["inventory"], revalidate: 120 },
);

export async function getRecentAdjustments(limit = 10): Promise<AdjustmentRow[]> {
  return db
    .select({
      id: inventoryAdjustments.id,
      label: cylinderTypes.label,
      delta: inventoryAdjustments.delta,
      reason: inventoryAdjustments.reason,
      adjustedAt: inventoryAdjustments.createdAt,
    })
    .from(inventoryAdjustments)
    .innerJoin(cylinderTypes, eq(inventoryAdjustments.cylinderTypeId, cylinderTypes.id))
    .orderBy(desc(inventoryAdjustments.createdAt))
    .limit(limit);
}
