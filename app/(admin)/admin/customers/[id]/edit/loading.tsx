import { FormSkeleton } from "@/components/shared/skeleton";

export default function EditCustomerLoading() {
  return (
    <div className="flex-1 p-4">
      <FormSkeleton fields={5} />
    </div>
  );
}
