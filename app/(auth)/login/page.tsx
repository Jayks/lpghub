import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/db/queries/auth";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign In — LPGHub" };

/**
 * If already authenticated, redirect to persona home.
 * Otherwise render the interactive login form.
 */
export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    if (user.role === "admin") redirect("/admin");
    if (user.role === "delivery_person") redirect("/delivery");
    redirect("/");
  }

  return <LoginForm />;
}
