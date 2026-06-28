import type { Metadata } from "next";
import { TopBar } from "@/components/layout/top-bar";
import { CustomerForm } from "@/components/admin/customer-form";

export const metadata: Metadata = { title: "Add Customer" };

export default function NewCustomerPage() {
  return (
    <>
      <TopBar title="Add Customer" backHref="/admin/customers" />
      <CustomerForm />
    </>
  );
}
