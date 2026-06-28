import type webpushType from "web-push";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import client from "@/lib/db/client";
import { pushSubscriptions, userRoles } from "@/lib/db/schema";

const db = drizzle(client);

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<void> {
  // Dynamic import required — static import crashes Turbopack worker
  const webpush = (
    (await import("web-push")) as unknown as { default: typeof webpushType }
  ).default;

  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload)
      )
    )
  );
}

export async function sendPushToAllAdmins(payload: PushPayload): Promise<void> {
  const admins = await db
    .select()
    .from(userRoles)
    .where(eq(userRoles.role, "admin"));

  await Promise.allSettled(
    admins.map((admin) => sendPushToUser(admin.userId, payload))
  );
}
