import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { getCurrentUser } from "@/lib/db/queries/auth";
import { getCustomerForUser } from "@/lib/db/queries/customers";
import { getInventoryWithTypes } from "@/lib/db/queries/inventory";
import { NewOrderForm } from "@/components/customer/new-order-form";

export const metadata: Metadata = { title: "Book Cylinders" };

export default async function NewOrderPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [customer, stock] = await Promise.all([
    getCustomerForUser(user.id, user.phone),
    getInventoryWithTypes(),
  ]);

  if (!customer) {
    return (
      <>
        <TopBar title="Book Cylinders" backHref="/" />
        <div className="flex-1 p-4">
          <div className="glass-sm rounded-2xl p-6 text-center space-y-1 mt-4">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Account not linked
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Contact your agency admin to activate your account.
            </p>
          </div>
        </div>
      </>
    );
  }

  if (!customer.isActive) {
    return (
      <>
        <TopBar title="Book Cylinders" backHref="/" />
        <div className="flex-1 p-4">
          <div className="glass-sm rounded-2xl p-6 text-center space-y-1 mt-4">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              Account inactive
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your account has been deactivated. Contact your agency admin.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title="Book Cylinders" backHref="/" />
      <div className="flex-1 p-4 pb-safe-nav">
        <NewOrderForm stock={stock} eligibilityLimit={customer.eligibilityLimit} />
      </div>
    </>
  );
}
