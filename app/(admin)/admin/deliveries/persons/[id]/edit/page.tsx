import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { EditDeliveryPersonForm } from "@/components/admin/edit-delivery-person-form";
import { getDeliveryPersonById } from "@/lib/db/queries/deliveries";

export const metadata: Metadata = { title: "Edit Delivery Person" };

export default async function EditDeliveryPersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const person = await getDeliveryPersonById(id);
  if (!person) notFound();

  return (
    <>
      <TopBar breadcrumbs={[
        { label: "Deliveries", href: "/admin/deliveries" },
        { label: person.name },
        { label: "Edit" },
      ]} />
      <div className="flex-1 p-4">
        <div className="glass rounded-2xl p-5">
          <EditDeliveryPersonForm
            id={id}
            initialName={person.name}
            phone={person.phone}
          />
        </div>
      </div>
    </>
  );
}
