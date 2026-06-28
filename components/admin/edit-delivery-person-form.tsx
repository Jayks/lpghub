"use client";

import { useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Lock } from "lucide-react";
import { toast } from "sonner";
import { updateDeliveryPersonAction } from "@/app/actions/delivery-persons";

interface Props {
  id: string;
  initialName: string;
  phone: string;
}

export function EditDeliveryPersonForm({ id, initialName, phone }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const nameRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateDeliveryPersonAction(id, formData);
      if (res.ok) {
        toast.success("Delivery person updated");
        router.back();
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
          ref={nameRef}
          name="name"
          type="text"
          required
          defaultValue={initialName}
          placeholder="e.g. Suresh Kumar"
          disabled={pending}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 disabled:opacity-60"
        />
      </div>

      {/* Phone — read-only, auth identity */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
          Mobile Number
          <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-slate-400 dark:text-slate-500">
            <Lock className="w-3 h-3" /> cannot be changed
          </span>
        </label>
        <div className="flex gap-2">
          <span className="px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-sm font-semibold text-slate-400 dark:text-slate-500 select-none">
            +91
          </span>
          <input
            type="tel"
            value={phone.replace(/^\+91/, "")}
            readOnly
            tabIndex={-1}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-sm font-medium text-slate-400 dark:text-slate-500 cursor-not-allowed"
          />
        </div>
        <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1">
          Phone is their OTP login — contact support to reassign.
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
          <Save className="w-5 h-5" />
        )}
        {pending ? "Saving…" : "Save Changes"}
      </button>
    </form>
  );
}
