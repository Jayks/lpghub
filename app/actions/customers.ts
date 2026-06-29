"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import pgClient from "@/lib/db/client";
import { customers, cautionDeposits } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/db/queries/auth";
import { createCustomerSchema, updateCustomerSchema } from "@/lib/schemas/customer";
import type { CreateCustomerInput, UpdateCustomerInput } from "@/lib/schemas/customer";

export type { CreateCustomerInput, UpdateCustomerInput } from "@/lib/schemas/customer";

const db = drizzle(pgClient);

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type CreateCustomerResult =
  | { ok: true; customerId: string }
  | { ok: false; error: string };

export type UpdateCustomerResult =
  | { ok: true }
  | { ok: false; error: string };

// â”€â”€â”€ Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function createCustomerAction(
  input: CreateCustomerInput
): Promise<CreateCustomerResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { ok: false, error: "Unauthorized" };
  }

  const parsed = createCustomerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const d = parsed.data;
  const formattedPhone = `+91${d.phone}`;

  try {
    const [customer] = await db
      .insert(customers)
      .values({
        businessName: d.businessName,
        contactPerson: d.contactPerson,
        phone: formattedPhone,
        address: d.address,
        eligibilityLimit: d.eligibilityLimit,
        isActive: true, // Active from the moment deposit is recorded
      })
      .returning();

    await db.insert(cautionDeposits).values({
      customerId: customer.id,
      amount: d.depositAmount.toString(),
      paidOn: d.depositPaidOn,
      paymentMode: d.depositPaymentMode,
      referenceNo: d.depositReferenceNo ?? null,
      notes: d.depositNotes ?? null,
      status: "received",
    });

    revalidatePath("/admin/customers");
    revalidateTag("admin-stats", "max");
    revalidateTag("customers-list", "max");
    return { ok: true, customerId: customer.id };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return { ok: false, error: "A customer with this phone number already exists." };
    }
    console.error("[createCustomerAction]", e);
    return { ok: false, error: "Failed to create customer. Please try again." };
  }
}

export async function updateCustomerAction(
  customerId: string,
  input: UpdateCustomerInput
): Promise<UpdateCustomerResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return { ok: false, error: "Unauthorized" };

  const parsed = updateCustomerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const d = parsed.data;

  try {
    await db
      .update(customers)
      .set({
        businessName:     d.businessName,
        contactPerson:    d.contactPerson,
        address:          d.address,
        eligibilityLimit: d.eligibilityLimit,
      })
      .where(eq(customers.id, customerId));

    revalidatePath(`/admin/customers/${customerId}`);
    revalidatePath("/admin/customers");
    revalidateTag("customers-list", "max");
    return { ok: true };
  } catch (e) {
    console.error("[updateCustomerAction]", e);
    return { ok: false, error: "Failed to update customer. Please try again." };
  }
}

export async function toggleCustomerActiveAction(
  customerId: string,
  isActive: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return { ok: false, error: "Unauthorized" };

  await db
    .update(customers)
    .set({ isActive })
    .where(eq(customers.id, customerId));

  revalidatePath(`/admin/customers/${customerId}`);
  revalidatePath("/admin/customers");
  revalidateTag("admin-stats", "max");
  revalidateTag("customers-list", "max");
  return { ok: true };
}
