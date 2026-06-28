import postgres from "postgres";
const sql = postgres("postgresql://postgres.jlpxrhyrxjypvopklbfp:Mdb%2316oct%401983@aws-1-ap-south-1.pooler.supabase.com:5432/postgres", { prepare: false, max: 1 });
try {
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number INTEGER`;
  await sql`CREATE SEQUENCE IF NOT EXISTS orders_order_number_seq START 1001`;
  await sql`ALTER TABLE orders ALTER COLUMN order_number SET DEFAULT nextval('orders_order_number_seq')`;
  await sql`UPDATE orders SET order_number = nextval('orders_order_number_seq') WHERE order_number IS NULL`;
  await sql`ALTER TABLE orders ALTER COLUMN order_number SET NOT NULL`;
  await sql`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_order_number_unique') THEN ALTER TABLE orders ADD CONSTRAINT orders_order_number_unique UNIQUE (order_number); END IF; END $$`;
  console.log("Done! order_number column ready.");
} catch(e) { console.error("Error:", e.message); } finally { await sql.end(); }
