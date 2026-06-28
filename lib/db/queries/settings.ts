import { inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import pgClient from "@/lib/db/client";
import { adminSettings } from "@/lib/db/schema";

const db = drizzle(pgClient);

export const SETTING_KEYS = [
  "max_cylinders_per_order",
  "caution_deposit_amount",
  "low_stock_threshold",
  "payment_confirmation_workflow",
  "delivery_assignment_mode",
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];

export type SettingsMap = Record<SettingKey, string>;

// Default values used when a key hasn't been saved yet
export const SETTING_DEFAULTS: SettingsMap = {
  max_cylinders_per_order:       "10",
  caution_deposit_amount:        "5000",
  low_stock_threshold:           "10",
  payment_confirmation_workflow: "admin_only",
  delivery_assignment_mode:      "manual",
};

export async function getSettings(): Promise<SettingsMap> {
  const rows = await db
    .select({ key: adminSettings.key, value: adminSettings.value })
    .from(adminSettings)
    .where(inArray(adminSettings.key, [...SETTING_KEYS]));

  const map = { ...SETTING_DEFAULTS };
  for (const row of rows) {
    if (row.key in map) {
      map[row.key as SettingKey] = row.value;
    }
  }
  return map;
}
