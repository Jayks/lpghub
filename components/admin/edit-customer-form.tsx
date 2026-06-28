"use client";

import { useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { toast } from "sonner";
import { updateCustomerAction } from "@/app/actions/customers";
import { updateCustomerSchema } from "@/lib/schemas/customer";
import type { UpdateCustomerInput } from "@/lib/schemas/customer";
import { Lock } from "lucide-react";

const INPUT_CLS =
  "w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40";
const LABEL_CLS = "block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5";
const ERROR_CLS = "mt-1 text-xs font-medium text-red-600 dark:text-red-400";

interface Props {
  customerId: string;
  initial: {
    businessName: string;
    contactPerson: string;
    phone: string;
    address: string;
    eligibilityLimit: number;
  };
}

export function EditCustomerForm({ customerId, initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = useForm<UpdateCustomerInput>({
    resolver: standardSchemaResolver(updateCustomerSchema) as unknown as Resolver<UpdateCustomerInput>,
    defaultValues: {
      businessName:     initial.businessName,
      contactPerson:    initial.contactPerson,
      address:          initial.address,
      eligibilityLimit: initial.eligibilityLimit,
    },
  });

  function onSubmit(data: UpdateCustomerInput) {
    startTransition(async () => {
      const result = await updateCustomerAction(customerId, data);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Customer updated");
      router.back();
    });
  }

  // Enter key navigates field-to-field, submits on the last field
  const advanceRef = useRef<Record<string, () => void>>({});
  advanceRef.current = {
    businessName:     () => setFocus("contactPerson"),
    contactPerson:    () => setFocus("address"),
    // address is a textarea — Enter adds a line break; Tab advances natively
    eligibilityLimit: () => handleSubmit(onSubmit)(),
  };

  function onEnter(field: keyof UpdateCustomerInput) {
    return (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && field !== "address") {
        e.preventDefault();
        advanceRef.current[field]?.();
      }
    };
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex-1 p-4 space-y-5">
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
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            onKeyDown={onEnter("businessName")}
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
            onKeyDown={onEnter("contactPerson")}
            className={INPUT_CLS}
          />
          {errors.contactPerson && <p className={ERROR_CLS}>{errors.contactPerson.message}</p>}
        </div>

        {/* Phone — read-only, auth identity */}
        <div>
          <label className={LABEL_CLS}>
            Mobile Number
            <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-slate-400 dark:text-slate-500">
              <Lock className="w-3 h-3" /> cannot be changed
            </span>
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 text-sm text-slate-400 dark:text-slate-500 font-medium select-none">
              +91
            </span>
            <input
              type="tel"
              value={initial.phone.replace(/^\+91/, "")}
              readOnly
              tabIndex={-1}
              className="flex-1 px-4 py-2.5 rounded-r-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-sm font-medium text-slate-400 dark:text-slate-500 cursor-not-allowed"
            />
          </div>
          <p className="mt-1 text-xs font-medium text-slate-400 dark:text-slate-500">
            Phone is the customer's OTP login — contact support to reassign.
          </p>
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
            inputMode="numeric"
            min={1}
            max={50}
            onKeyDown={onEnter("eligibilityLimit")}
            className={INPUT_CLS}
          />
          {errors.eligibilityLimit && <p className={ERROR_CLS}>{errors.eligibilityLimit.message}</p>}
        </div>
      </section>

      <button
        type="submit"
        disabled={pending}
        className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-br from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending ? "Saving…" : "Save Changes"}
      </button>
    </form>
  );
}
