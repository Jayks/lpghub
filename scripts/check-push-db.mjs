/**
 * scripts/check-push-db.mjs
 * Diagnoses whether admin push subscriptions are correctly saved.
 * Run: node scripts/check-push-db.mjs
 */
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });

const [subs, roles] = await Promise.all([
  sql`SELECT user_id, LEFT(endpoint, 60) AS endpoint_preview FROM push_subscriptions`,
  sql`SELECT user_id, role FROM user_roles`,
]);

console.log("\n── push_subscriptions ──");
if (subs.length === 0) {
  console.log("  (empty — no subscriptions saved)");
} else {
  subs.forEach(r =>
    console.log(`  user_id=${r.user_id}  endpoint=${r.endpoint_preview}…`)
  );
}

console.log("\n── user_roles ──");
if (roles.length === 0) {
  console.log("  (empty)");
} else {
  roles.forEach(r => console.log(`  role=${r.role}  user_id=${r.user_id}`));
}

const adminIds = roles.filter(r => r.role === "admin").map(r => r.user_id);
const subIds   = subs.map(r => r.user_id);
const covered  = adminIds.filter(id => subIds.includes(id));

console.log("\n── admin subscription check ──");
console.log(`  Admin user IDs:            ${adminIds.join(", ") || "(none in user_roles)"}`);
console.log(`  Subscriptions for admins:  ${covered.length > 0 ? "✅ found" : "❌ none — this is the problem"}`);

await sql.end();
