"use server";

import { revalidatePath } from "next/cache";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import pgClient from "@/lib/db/client";
import { deliveryPersons } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/db/queries/auth";
import { formatPhone } from "@/lib/utils/format-phone";
import { z } from "zod";

const db = drizzle(pgClient);

type ActionResult = { ok: true } | { ok: false; error: string };

const AddDeliveryPersonSchema = z.object({
  name:  z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Enter a valid phone number"),
});

// ─── Add a new delivery person ────────────────────────────────────────────────

export async function addDeliveryPersonAction(
  formData: FormData
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return { ok: false, error: "Unauthorized" };

  const parsed = AddDeliveryPersonSchema.safeParse({
    name:  formData.get("name"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const phone = formatPhone(parsed.data.phone);

  try {
    // Check for duplicate phone
    const [existing] = await db
      .select({ id: deliveryPersons.id })
      .from(deliveryPersons)
      .where(eq(deliveryPersons.phone, phone));

    if (existing) {
      return { ok: false, error: "A delivery person with this phone number already exists" };
    }

    await db.insert(deliveryPersons).values({
      name:     parsed.data.name.trim(),
      phone,
      isActive: true,
    });

    revalidatePath("/admin/deliveries");
    return { ok: true };
  } catch (e) {
    console.error("[addDeliveryPersonAction]", e);
    return { ok: false, error: "Failed to add delivery person. Please try again." };
  }
}

// ─── Toggle active / inactive ─────────────────────────────────────────────────

export async function toggleDeliveryPersonAction(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return { ok: false, error: "Unauthorized" };

  try {
    await db
      .update(deliveryPersons)
      .set({ isActive })
      .where(eq(deliveryPersons.id, id));

    revalidatePath("/admin/deliveries");
    return { ok: true };
  } catch (e) {
    console.error("[toggleDeliveryPersonAction]", e);
    return { ok: false, error: "Failed to update status. Please try again." };
  }
}
