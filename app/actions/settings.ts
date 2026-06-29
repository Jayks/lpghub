"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import pgClient from "@/lib/db/client";
import { adminSettings } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/db/queries/auth";
import { SETTING_KEYS } from "@/lib/db/queries/settings";
import type { SettingKey } from "@/lib/db/queries/settings";

const db = drizzle(pgClient);

type ActionResult = { ok: true } | { ok: false; error: string };

export async function saveSettingsAction(
  updates: Partial<Record<SettingKey, string>>
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return { ok: false, error: "Unauthorized" };

  // Only persist known keys
  const entries = Object.entries(updates).filter(([k]) =>
    SETTING_KEYS.includes(k as SettingKey)
  ) as Array<[SettingKey, string]>;

  if (entries.length === 0) return { ok: true };

  try {
    // Upsert each key individually â€” postgres.js + Drizzle doesn't support
    // batched onConflictDoUpdate with different values per row cleanly.
    for (const [key, value] of entries) {
      await db
        .insert(adminSettings)
        .values({ key, value, updatedBy: user.id, updatedAt: sql`now()` })
        .onConflictDoUpdate({
          target: adminSettings.key,
          set: { value, updatedBy: user.id, updatedAt: sql`now()` },
        });
    }

    revalidatePath("/admin/settings");
    revalidateTag("settings", "max");
    return { ok: true };
  } catch (e) {
    console.error("[saveSettingsAction]", e);
    return { ok: false, error: "Failed to save settings. Please try again." };
  }
}
