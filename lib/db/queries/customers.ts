import { desc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { formatPhone } from "@/lib/utils/format-phone";
import { drizzle } from "drizzle-orm/postgres-js";
import pgClient from "@/lib/db/client";
import { customers, cautionDeposits, orders } from "@/lib/db/schema";

const db = drizzle(pgClient);

export type CustomerRow = {
  id: string;
  businessName: string;
  contactPerson: string;
  phone: string;
  isActive: boolean;
  eligibilityLimit: number;
  createdAt: Date | null;
};

// Cached — invalidated by createCustomer, updateCustomer, toggleCustomerActive actions.
export const getCustomers = unstable_cache(
  async (): Promise<CustomerRow[]> =>
    db
      .select({
        id:               customers.id,
        businessName:     customers.businessName,
        contactPerson:    customers.contactPerson,
        phone:            customers.phone,
        isActive:         customers.isActive,
        eligibilityLimit: customers.eligibilityLimit,
        createdAt:        customers.createdAt,
      })
      .from(customers)
      .orderBy(desc(customers.createdAt)),
  ["customers-list"],
  { tags: ["customers-list"], revalidate: 120 },
);

export async function getCustomerById(id: string) {
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, id));
  if (!customer) return null;

  // Both sub-queries only need `id` (a parameter) — run in parallel.
  const [deposits, orderHistory] = await Promise.all([
    db
      .select()
      .from(cautionDeposits)
      .where(eq(cautionDeposits.customerId, id))
      .orderBy(desc(cautionDeposits.createdAt)),

    db
      .select({
        id:          orders.id,
        orderNumber: orders.orderNumber,
        status:      orders.status,
        totalAmount: orders.totalAmount,
        createdAt:   orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.customerId, id))
      .orderBy(desc(orders.createdAt))
      .limit(20),
  ]);

  return { ...customer, deposits, orderHistory };
}

export async function getCustomerByAuthUserId(authUserId: string) {
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.authUserId, authUserId));
  return customer ?? null;
}

/**
 * Find a customer by auth user ID, falling back to phone if not yet linked.
 * If found via phone, repairs the authUserId link for future calls.
 */
export async function getCustomerForUser(
  authUserId: string,
  phone?: string | null
) {
  // Primary: look up by auth user ID (fast, indexed)
  const byId = await getCustomerByAuthUserId(authUserId);
  if (byId) return byId;

  // Fallback: look up by phone (phone OTP = identity proof)
  // Normalize first — Supabase stores auth phone as "919876543210" (no +),
  // but our customers table stores "+919876543210".
  if (!phone) return null;
  const normalizedPhone = formatPhone(phone);
  const [byPhone] = await db
    .select()
    .from(customers)
    .where(eq(customers.phone, normalizedPhone));
  if (!byPhone) return null;

  // Repair the link so future calls hit the fast path
  await db
    .update(customers)
    .set({ authUserId })
    .where(eq(customers.id, byPhone.id));

  console.log("[getCustomerForUser] repaired authUserId link for customer", byPhone.id);
  return byPhone;
}

export async function getCustomerByPhone(phone: string) {
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.phone, phone));
  return customer ?? null;
}
