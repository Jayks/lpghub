import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { PageWrapper } from "@/components/shared/page-wrapper";
import { EmptyState } from "@/components/shared/empty-state";
import { getCurrentUser } from "@/lib/db/queries/auth";
import { getCustomerForUser } from "@/lib/db/queries/customers";
import { getInventoryWithTypes } from "@/lib/db/queries/inventory";
import { getActiveCylinderCount } from "@/lib/db/queries/customer-orders";
import { NewOrderForm } from "@/components/customer/new-order-form";
import { ShoppingCart, AlertCircle } from "lucide-react";

export const metadata: Metadata = { title: "Book Cylinders" };

export default async function NewOrderPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [customer, stock] = await Promise.all([
    getCustomerForUser(user.id, user.phone),
    getInventoryWithTypes(),
  ]);

  const activeCylinders = customer
    ? await getActiveCylinderCount(customer.id)
    : 0;

  if (!customer) {
    return (
      <>
        <TopBar title="Book Cylinders" backHref="/" />
        <PageWrapper className="flex-1 p-4">
          <EmptyState
            icon={ShoppingCart}
            title="Account not linked"
            description="Contact your agency admin to activate your account."
          />
        </PageWrapper>
      </>
    );
  }

  if (!customer.isActive) {
    return (
      <>
        <TopBar title="Book Cylinders" backHref="/" />
        <PageWrapper className="flex-1 p-4">
          <EmptyState
            icon={AlertCircle}
            title="Account inactive"
            description="Your account has been deactivated. Contact your agency admin."
          />
        </PageWrapper>
      </>
    );
  }

  return (
    <>
      <TopBar title="Book Cylinders" backHref="/" />
      <PageWrapper className="flex-1 p-4 pb-safe-nav">
        <NewOrderForm
          stock={stock}
          eligibilityLimit={customer.eligibilityLimit}
          activeCylinders={activeCylinders}
        />
      </PageWrapper>
    </>
  );
}
