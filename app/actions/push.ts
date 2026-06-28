"use server";

import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import pgClient from "@/lib/db/client";
import { pushSubscriptions } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/db/queries/auth";

const db = drizzle(pgClient);

export async function savePushSubscription(sub: {
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };

  // Idempotent — skip if this endpoint is already saved for this user
  const existing = await db
    .select({ id: pushSubscriptions.id })
    .from(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, user.id),
        eq(pushSubscriptions.endpoint, sub.endpoint)
      )
    )
    .limit(1);

  if (existing.length > 0) return { ok: true };

  await db.insert(pushSubscriptions).values({
    userId: user.id,
    endpoint: sub.endpoint,
    p256dh: sub.p256dh,
    auth: sub.auth,
  });

  return { ok: true };
}

export async function deleteMyPushSubscription(
  endpoint: string
): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };

  await db
    .delete(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, user.id),
        eq(pushSubscriptions.endpoint, endpoint)
      )
    );

  return { ok: true };
}
