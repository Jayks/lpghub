import { FormSkeleton } from "@/components/shared/skeleton";

export default function EditDeliveryPersonLoading() {
  return (
    <div className="flex-1 p-4">
      <FormSkeleton fields={2} />
    </div>
  );
}
