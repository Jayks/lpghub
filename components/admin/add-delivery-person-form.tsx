"use client";

import { useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { addDeliveryPersonAction } from "@/app/actions/delivery-persons";

export function AddDeliveryPersonForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const phoneRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    startTransition(async () => {
      const res = await addDeliveryPersonAction(data);
      if (res.ok) {
        toast.success("Delivery person added");
        router.push("/admin/deliveries");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          name="name"
          type="text"
          required
          placeholder="e.g. Suresh Kumar"
          disabled={pending}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              phoneRef.current?.focus();
            }
          }}
          className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 disabled:opacity-60"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
          Mobile Number <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <span className="px-3 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-600 dark:text-slate-400 select-none">
            +91
          </span>
          <input
            ref={phoneRef}
            name="phone"
            type="tel"
            required
            inputMode="numeric"
            maxLength={10}
            placeholder="9876543210"
            disabled={pending}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 disabled:opacity-60"
          />
        </div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
          They will use this number to log in via OTP
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-br from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
      >
        {pending ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <UserPlus className="w-5 h-5" />
        )}
        {pending ? "Adding…" : "Add Delivery Person"}
      </button>
    </form>
  );
}
