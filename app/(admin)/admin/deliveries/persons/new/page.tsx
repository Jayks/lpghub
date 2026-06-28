import type { Metadata } from "next";
import { TopBar } from "@/components/layout/top-bar";
import { AddDeliveryPersonForm } from "@/components/admin/add-delivery-person-form";

export const metadata: Metadata = { title: "Add Delivery Person" };

export default function AddDeliveryPersonPage() {
  return (
    <>
      <TopBar title="Add Delivery Person" backHref="/admin/deliveries" />
      <div className="flex-1 p-4">
        <div className="glass rounded-2xl p-5">
          <AddDeliveryPersonForm />
        </div>
      </div>
    </>
  );
}
