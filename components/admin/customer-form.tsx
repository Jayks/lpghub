"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { toast } from "sonner";
import { createCustomerAction } from "@/app/actions/customers";
import { createCustomerSchema } from "@/lib/schemas/customer";
import type { CreateCustomerInput } from "@/lib/schemas/customer";

const PAYMENT_MODES = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
] as const;

const INPUT_CLS =
  "w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40";
const LABEL_CLS = "block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5";
const ERROR_CLS = "mt-1 text-xs font-medium text-red-600 dark:text-red-400";

export function CustomerForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateCustomerInput>({
    // standardSchemaResolver works with Zod v4 (implements Standard Schema v1 spec).
    // zodResolver only supports Zod v3 and throws at runtime with Zod v4 schemas.
    resolver: standardSchemaResolver(createCustomerSchema) as unknown as Resolver<CreateCustomerInput>,
    defaultValues: {
      eligibilityLimit: 5,
      depositPaymentMode: "cash",
      depositPaidOn: new Date().toISOString().split("T")[0],
    },
  });

  function onSubmit(data: unknown) {
    const typedData = data as CreateCustomerInput;
    startTransition(async () => {
      const result = await createCustomerAction(typedData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Customer created successfully");
      router.push(`/admin/customers/${result.customerId}`);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex-1 p-4 space-y-5">
      {/* Business details */}
      <section className="glass rounded-2xl p-5 space-y-4">
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          Business Details
        </h2>

        <div>
          <label className={LABEL_CLS}>Business Name</label>
          <input
            {...register("businessName")}
            type="text"
            placeholder="e.g. Sunrise Bakery"
            className={INPUT_CLS}
          />
          {errors.businessName && <p className={ERROR_CLS}>{errors.businessName.message}</p>}
        </div>

        <div>
          <label className={LABEL_CLS}>Contact Person</label>
          <input
            {...register("contactPerson")}
            type="text"
            placeholder="e.g. Ravi Kumar"
            className={INPUT_CLS}
          />
          {errors.contactPerson && <p className={ERROR_CLS}>{errors.contactPerson.message}</p>}
        </div>

        <div>
          <label className={LABEL_CLS}>Mobile Number</label>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-sm text-slate-600 dark:text-slate-400 font-medium">
              +91
            </span>
            <input
              {...register("phone")}
              type="tel"
              placeholder="98765 43210"
              maxLength={10}
              inputMode="numeric"
              className="flex-1 px-4 py-2.5 rounded-r-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            />
          </div>
          {errors.phone && <p className={ERROR_CLS}>{errors.phone.message}</p>}
        </div>

        <div>
          <label className={LABEL_CLS}>Delivery Address</label>
          <textarea
            {...register("address")}
            rows={2}
            placeholder="Full delivery address…"
            className={INPUT_CLS + " resize-none"}
          />
          {errors.address && <p className={ERROR_CLS}>{errors.address.message}</p>}
        </div>

        <div>
          <label className={LABEL_CLS}>Cylinder Eligibility Limit</label>
          <input
            {...register("eligibilityLimit")}
            type="number"
            min={1}
            max={50}
            className={INPUT_CLS}
          />
          {errors.eligibilityLimit && <p className={ERROR_CLS}>{errors.eligibilityLimit.message}</p>}
        </div>
      </section>

      {/* Caution deposit */}
      <section className="glass rounded-2xl p-5 space-y-4">
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          Caution Deposit
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLS}>Amount (₹)</label>
            <input
              {...register("depositAmount")}
              type="number"
              min={0}
              step="0.01"
              placeholder="5000"
              className={INPUT_CLS}
            />
            {errors.depositAmount && <p className={ERROR_CLS}>{errors.depositAmount.message}</p>}
          </div>
          <div>
            <label className={LABEL_CLS}>Date Paid</label>
            <input
              {...register("depositPaidOn")}
              type="date"
              className={INPUT_CLS}
            />
            {errors.depositPaidOn && <p className={ERROR_CLS}>{errors.depositPaidOn.message}</p>}
          </div>
        </div>

        <div>
          <label className={LABEL_CLS}>Payment Mode</label>
          <select {...register("depositPaymentMode")} className={INPUT_CLS}>
            {PAYMENT_MODES.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          {errors.depositPaymentMode && <p className={ERROR_CLS}>{errors.depositPaymentMode.message}</p>}
        </div>

        <div>
          <label className={LABEL_CLS}>Reference No. <span className="text-slate-400 font-normal">(optional)</span></label>
          <input
            {...register("depositReferenceNo")}
            type="text"
            placeholder="Transaction / receipt reference"
            className={INPUT_CLS}
          />
        </div>

        <div>
          <label className={LABEL_CLS}>Notes <span className="text-slate-400 font-normal">(optional)</span></label>
          <input
            {...register("depositNotes")}
            type="text"
            placeholder="Any additional notes"
            className={INPUT_CLS}
          />
        </div>
      </section>

      <button
        type="submit"
        disabled={pending}
        className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-br from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending ? "Creating…" : "Create Customer"}
      </button>
    </form>
  );
}
