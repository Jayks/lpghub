import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const {
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  DATABASE_URL
} = process.env;

let allOk = true;

function ok(label)        { console.log(`  ✅ ${label}`); }
function fail(label, msg) { console.log(`  ❌ ${label}: ${msg}`); allOk = false; }
function section(title)   { console.log(`\n── ${title} ──────────────────────────`); }

// ─── 1. Env var presence ────────────────────────────────────────────────────
section("Env vars");
if (NEXT_PUBLIC_SUPABASE_URL?.startsWith("https://")) ok("NEXT_PUBLIC_SUPABASE_URL");
else fail("NEXT_PUBLIC_SUPABASE_URL", NEXT_PUBLIC_SUPABASE_URL || "(empty)");

if (NEXT_PUBLIC_SUPABASE_ANON_KEY?.length > 20) ok("NEXT_PUBLIC_SUPABASE_ANON_KEY");
else fail("NEXT_PUBLIC_SUPABASE_ANON_KEY", "(empty or too short)");

if (SUPABASE_SERVICE_ROLE_KEY?.length > 20) ok("SUPABASE_SERVICE_ROLE_KEY");
else fail("SUPABASE_SERVICE_ROLE_KEY", "(empty or too short)");

if (DATABASE_URL?.startsWith("postgres")) ok("DATABASE_URL");
else fail("DATABASE_URL", DATABASE_URL || "(empty)");

// ─── 2. Supabase Auth API (anon key ping) ───────────────────────────────────
section("Supabase Auth API");
try {
  const res = await fetch(`${NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
    headers: { apikey: NEXT_PUBLIC_SUPABASE_ANON_KEY }
  });
  if (res.ok) ok(`Auth API reachable (HTTP ${res.status})`);
  else fail("Auth API", `HTTP ${res.status} — ${await res.text()}`);
} catch (e) {
  fail("Auth API", e.message);
}

// ─── 3. Supabase Admin API (service role key) ────────────────────────────────
section("Supabase Admin API (service role)");
try {
  const res = await fetch(
    `${NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=1`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      }
    }
  );
  if (res.ok) ok(`Admin API reachable (HTTP ${res.status})`);
  else fail("Admin API", `HTTP ${res.status} — ${await res.text()}`);
} catch (e) {
  fail("Admin API", e.message);
}

// ─── 4. Direct Postgres (DATABASE_URL) ──────────────────────────────────────
section("Postgres / DATABASE_URL");
try {
  const { default: postgres } = await import("postgres");
  const sql = postgres(DATABASE_URL, { max: 1, connect_timeout: 10 });
  const [row] = await sql`SELECT current_database() AS db, now() AS ts`;
  ok(`Connected — DB: ${row.db}, server time: ${new Date(row.ts).toLocaleTimeString()}`);
  await sql.end();
} catch (e) {
  fail("Postgres", e.message);
}

// ─── Summary ────────────────────────────────────────────────────────────────
console.log("\n" + "─".repeat(45));
if (allOk) {
  console.log("✅  All checks passed — ready to go!");
} else {
  console.log("❌  Some checks failed — review above.");
  process.exit(1);
}
