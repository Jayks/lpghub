import { FormSkeleton } from "@/components/shared/skeleton";

export default function NewCustomerLoading() {
  return (
    <div className="flex-1 p-4">
      <FormSkeleton fields={6} />
    </div>
  );
}
