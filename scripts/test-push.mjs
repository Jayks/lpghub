/**
 * scripts/test-push.mjs
 *
 * Sends a real push notification to the first subscription in the DB.
 * Run with: node scripts/test-push.mjs
 *
 * Requirements: .env.local must have VAPID keys + DATABASE_URL filled in.
 */

import { config } from "dotenv";
import postgres from "postgres";
import webpush from "web-push";

config({ path: ".env.local" });

const {
  NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY,
  VAPID_EMAIL,
  DATABASE_URL,
} = process.env;

if (!NEXT_PUBLIC_VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_EMAIL) {
  console.error("❌  Missing VAPID env vars. Check .env.local.");
  process.exit(1);
}

if (!DATABASE_URL) {
  console.error("❌  Missing DATABASE_URL. Check .env.local.");
  process.exit(1);
}

webpush.setVapidDetails(
  VAPID_EMAIL.startsWith("mailto:") ? VAPID_EMAIL : `mailto:${VAPID_EMAIL}`,
  NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

const sql = postgres(DATABASE_URL, { prepare: false, max: 1 });

const rows = await sql`
  SELECT endpoint, p256dh, auth FROM push_subscriptions LIMIT 1
`;

if (rows.length === 0) {
  console.error("❌  No subscriptions in push_subscriptions table.");
  console.error("    Log in to the app first so the browser can subscribe.");
  await sql.end();
  process.exit(1);
}

const { endpoint, p256dh, auth } = rows[0];

const payload = JSON.stringify({
  title: "LPGHub test 🔔",
  body: "If you see this, end-to-end push is working!",
  url: "/",
});

try {
  await webpush.sendNotification(
    { endpoint, keys: { p256dh, auth } },
    payload
  );
  console.log("✅  Push sent. Check your browser for the notification.");
} catch (err) {
  console.error("❌  Push failed:", err.message);
}

await sql.end();
