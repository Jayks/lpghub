/**
 * seeds the database with cylinder types and initial inventory.
 * Safe to run multiple times (idempotent via conflict checks).
 *
 * Usage: pnpm db:seed
 */
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { cylinderTypes, inventory } from "../lib/db/schema";

const sql = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 });
const db = drizzle(sql);

const CYLINDER_SEED = [
  { label: "15kg", unitPrice: "1200.00", stock: 100 },
  { label: "17kg", unitPrice: "1350.00", stock: 60 },
  { label: "20kg", unitPrice: "1600.00", stock: 40 },
];

async function seed() {
  console.log("🌱 Seeding cylinder types and inventory…\n");

  for (const cyl of CYLINDER_SEED) {
    // Check if cylinder type already exists
    const existing = await db
      .select({ id: cylinderTypes.id })
      .from(cylinderTypes)
      .where(eq(cylinderTypes.label, cyl.label));

    let typeId: string;

    if (existing.length > 0) {
      typeId = existing[0].id;
      console.log(`  ⏭  ${cyl.label} already exists (id: ${typeId})`);
    } else {
      const [created] = await db
        .insert(cylinderTypes)
        .values({ label: cyl.label, unitPrice: cyl.unitPrice })
        .returning({ id: cylinderTypes.id });
      typeId = created.id;
      console.log(`  ✅ Created cylinder type: ${cyl.label} @ ₹${cyl.unitPrice}`);
    }

    // Check if inventory row exists
    const existingInv = await db
      .select({ id: inventory.id })
      .from(inventory)
      .where(eq(inventory.cylinderTypeId, typeId));

    if (existingInv.length > 0) {
      console.log(`  ⏭  Inventory for ${cyl.label} already exists`);
    } else {
      await db.insert(inventory).values({
        cylinderTypeId: typeId,
        totalStock: cyl.stock,
        availableStock: cyl.stock,
        reservedStock: 0,
        deliveredStock: 0,
      });
      console.log(`  ✅ Created inventory for ${cyl.label}: ${cyl.stock} units`);
    }
  }

  console.log("\n✅ Seed complete.");
  await sql.end();
}

seed().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
