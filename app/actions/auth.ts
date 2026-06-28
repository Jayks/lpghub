"use server";

import { cookies } from "next/headers";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import pgClient from "@/lib/db/client";
import { userRoles, customers, deliveryPersons } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPhone } from "@/lib/utils/format-phone";

// ─── DB ───────────────────────────────────────────────────────────────────────
const db = drizzle(pgClient);

// ─── Test-mode constants ──────────────────────────────────────────────────────
const IS_TEST_MODE = process.env.NEXT_PUBLIC_TEST_MODE === "true";
const TEST_OTP = "123456";
// These match the hints shown in the login UI — not sensitive, just dev convenience
const TEST_ADMIN_EMAIL = "admin@lpghub.test";
const TEST_ADMIN_PASSWORD = "Test@lpghub1";

// ─── Types ────────────────────────────────────────────────────────────────────
export type UserRole = "admin" | "customer" | "delivery_person";

export type AuthResult =
  | { ok: true; testMode?: boolean; hint?: string }
  | { ok: false; error: string };

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function ensureRole(userId: string, role: UserRole): Promise<void> {
  const [existing] = await db
    .select({ id: userRoles.id })
    .from(userRoles)
    .where(eq(userRoles.userId, userId));
  if (!existing) {
    await db.insert(userRoles).values({ userId, role });
  }
}

/**
 * Link the Supabase auth user to the customers record (if any) with the same phone.
 * Always updates authUserId on successful OTP — completing phone OTP is the identity
 * proof, so whoever verified the OTP owns that phone and customer account.
 * Safe to call multiple times (idempotent when userId is already correct).
 */
async function linkCustomerAccount(userId: string, phone: string): Promise<void> {
  const normalizedPhone = formatPhone(phone);
  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.phone, normalizedPhone));

  if (customer) {
    await db
      .update(customers)
      .set({ authUserId: userId })
      .where(eq(customers.id, customer.id));
  }
}

/**
 * Link the Supabase auth user to the delivery_persons record with the same phone.
 * Completing phone OTP is identity proof — always update authUserId.
 */
async function linkDeliveryPersonAccount(userId: string, phone: string): Promise<void> {
  const normalizedPhone = formatPhone(phone);
  const [person] = await db
    .select({ id: deliveryPersons.id })
    .from(deliveryPersons)
    .where(eq(deliveryPersons.phone, normalizedPhone));

  if (person) {
    await db
      .update(deliveryPersons)
      .set({ authUserId: userId })
      .where(eq(deliveryPersons.id, person.id));
  }
}

async function setRoleCookie(role: UserRole): Promise<void> {
  const jar = await cookies();
  jar.set("lpghub-role", role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Test-mode phone sign-in:
 * 1. Get/create a stable test user for this phone number via admin API
 * 2. Generate a magic-link token for that user
 * 3. Exchange the token for a real Supabase session (sets cookies via SSR client)
 */
async function testModePhoneSignIn(
  phone: string,
  role: "customer" | "delivery_person"
): Promise<AuthResult> {
  const admin = createAdminClient();
  // Derive a stable, predictable email from the phone so the same account
  // is reused across sign-in attempts.
  const testEmail = `test_${phone.replace(/\+/g, "")}@lpghub.test`;

  // Create user if they don't exist — safe to ignore "already exists" errors
  const { data: createData } = await admin.auth.admin.createUser({
    email: testEmail,
    email_confirm: true,
    phone,
    phone_confirm: true,
    user_metadata: { is_test_user: true, phone },
  });
  if (createData.user) {
    await ensureRole(createData.user.id, role);
  }

  // Generate a magic-link token (works whether user is new or pre-existing)
  const { data: linkData, error: linkErr } =
    await admin.auth.admin.generateLink({
      type: "magiclink",
      email: testEmail,
    });

  if (linkErr || !linkData?.properties?.hashed_token) {
    return { ok: false, error: linkErr?.message ?? "Failed to generate test session" };
  }

  // Exchange the hashed token for a real session — the SSR client writes cookies
  const supabase = await createClient();
  const { error: verifyErr } = await supabase.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: "email",
  });
  if (verifyErr) return { ok: false, error: verifyErr.message };

  // Use linkData.user (from admin API) — avoids cookie timing issues where
  // getUser() on the same SSR client reads pre-action cookies and sees no session yet.
  const linkUser = linkData.user;
  if (linkUser) {
    await ensureRole(linkUser.id, role);
    if (role === "customer") await linkCustomerAccount(linkUser.id, phone);
    if (role === "delivery_person") await linkDeliveryPersonAccount(linkUser.id, phone);
  }

  await setRoleCookie(role);
  return { ok: true };
}

// ─── Public server actions ────────────────────────────────────────────────────

/**
 * Step 1 of phone OTP: send the OTP (or, in test mode, return a hint).
 */
export async function sendOtpAction(
  phone: string,
  persona: "customer" | "delivery_person"
): Promise<AuthResult> {
  if (IS_TEST_MODE) {
    return { ok: true, testMode: true, hint: `Test mode — OTP is ${TEST_OTP}` };
  }

  const formatted = formatPhone(phone);
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ phone: formatted });
  if (error) return { ok: false, error: error.message };
  return { ok: true, testMode: false };
}

/**
 * Step 2 of phone OTP: verify the token and establish a session.
 */
export async function verifyOtpAction(
  phone: string,
  token: string,
  persona: "customer" | "delivery_person"
): Promise<AuthResult> {
  const formatted = formatPhone(phone);

  if (IS_TEST_MODE) {
    if (token !== TEST_OTP) {
      return { ok: false, error: `Invalid test OTP — expected ${TEST_OTP}.` };
    }
    return testModePhoneSignIn(formatted, persona);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    phone: formatted,
    token,
    type: "sms",
  });
  if (error) return { ok: false, error: error.message };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await ensureRole(user.id, persona);
    if (persona === "customer") await linkCustomerAccount(user.id, formatted);
    if (persona === "delivery_person") await linkDeliveryPersonAccount(user.id, formatted);
    await setRoleCookie(persona);
  }
  return { ok: true };
}

/**
 * Admin email + password sign-in.
 * In test mode, auto-creates the admin account on first use.
 */
export async function signInWithEmailAction(
  email: string,
  password: string
): Promise<AuthResult> {
  if (IS_TEST_MODE && email === TEST_ADMIN_EMAIL) {
    // Auto-provision the test admin user if they don't exist yet
    const admin = createAdminClient();
    const { data: createData } = await admin.auth.admin.createUser({
      email: TEST_ADMIN_EMAIL,
      password: TEST_ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { is_test_user: true },
    });
    if (createData.user) {
      await ensureRole(createData.user.id, "admin");
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return { ok: false, error: error.message };

  if (data.user) {
    await ensureRole(data.user.id, "admin");
    await setRoleCookie("admin");
  }
  return { ok: true };
}

/**
 * Sign out the current user and clear the role cookie.
 */
export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const jar = await cookies();
  jar.delete("lpghub-role");
}

