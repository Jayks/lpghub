import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { EditCustomerForm } from "@/components/admin/edit-customer-form";
import { getCustomerById } from "@/lib/db/queries/customers";

export const metadata: Metadata = { title: "Edit Customer" };

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomerById(id);
  if (!customer) notFound();

  return (
    <>
      <TopBar breadcrumbs={[
        { label: "Customers", href: "/admin/customers" },
        { label: customer.businessName, href: `/admin/customers/${id}` },
        { label: "Edit" },
      ]} />
      <EditCustomerForm
        customerId={id}
        initial={{
          businessName:     customer.businessName,
          contactPerson:    customer.contactPerson,
          phone:            customer.phone,
          address:          customer.address,
          eligibilityLimit: customer.eligibilityLimit,
        }}
      />
    </>
  );
}
