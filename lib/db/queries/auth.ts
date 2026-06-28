import { cache } from "react";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import client from "@/lib/db/client";
import { userRoles } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

const db = drizzle(client);

export type UserRole = "admin" | "customer" | "delivery_person";

export interface CurrentUser {
  id: string;
  email?: string | null;
  phone?: string | null;
  role: UserRole;
}

/**
 * Returns the authenticated user with their role.
 * React-cache deduplicates calls within a single render tree.
 * Never use getSession() — it's cookie-only with no server validation.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [roleRow] = await db
    .select()
    .from(userRoles)
    .where(eq(userRoles.userId, user.id));

  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    role: (roleRow?.role as UserRole) ?? "customer",
  };
});
