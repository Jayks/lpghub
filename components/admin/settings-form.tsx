"use client";

import { useState, useTransition } from "react";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { saveSettingsAction } from "@/app/actions/settings";
import type { SettingsMap } from "@/lib/db/queries/settings";

interface Props {
  initial: SettingsMap;
}

export function SettingsForm({ initial }: Props) {
  const [values, setValues] = useState<SettingsMap>({ ...initial });
  const [pending, startTransition] = useTransition();

  function set(key: keyof SettingsMap, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    startTransition(async () => {
      const res = await saveSettingsAction(values);
      if (res.ok) {
        toast.success("Settings saved");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="space-y-5">

      {/* Operational config */}
      <section className="glass rounded-2xl p-5 space-y-5">
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          Operational Config
        </h2>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            Max Cylinders per Order
          </label>
          <input
            type="number"
            min={1}
            value={values.max_cylinders_per_order}
            onChange={(e) => set("max_cylinders_per_order", e.target.value)}
            disabled={pending}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 disabled:opacity-60"
          />
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Global limit for a single booking
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            Default Caution Deposit (₹)
          </label>
          <input
            type="number"
            min={0}
            value={values.caution_deposit_amount}
            onChange={(e) => set("caution_deposit_amount", e.target.value)}
            disabled={pending}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 disabled:opacity-60"
          />
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Expected deposit from new customers
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            Low Stock Alert Threshold
          </label>
          <input
            type="number"
            min={0}
            value={values.low_stock_threshold}
            onChange={(e) => set("low_stock_threshold", e.target.value)}
            disabled={pending}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 disabled:opacity-60"
          />
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Alert when available stock drops below this value
          </p>
        </div>
      </section>

      {/* Workflow config */}
      <section className="glass rounded-2xl p-5 space-y-4">
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          Workflow Config
        </h2>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            Payment Confirmation Mode
          </label>
          <select
            value={values.payment_confirmation_workflow}
            onChange={(e) => set("payment_confirmation_workflow", e.target.value)}
            disabled={pending}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 disabled:opacity-60"
          >
            <option value="admin_only">Admin Only (manual)</option>
            <option value="auto">Auto (webhook — future)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            Delivery Assignment Mode
          </label>
          <select
            value={values.delivery_assignment_mode}
            onChange={(e) => set("delivery_assignment_mode", e.target.value)}
            disabled={pending}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 disabled:opacity-60"
          >
            <option value="manual">Manual</option>
            <option value="auto_round_robin">Auto Round Robin (future)</option>
          </select>
        </div>
      </section>

      <button
        onClick={handleSave}
        disabled={pending}
        className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-br from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 disabled:opacity-60 transition-all shadow-sm flex items-center justify-center gap-2"
      >
        {pending ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Save className="w-5 h-5" />
        )}
        {pending ? "Saving…" : "Save Settings"}
      </button>
    </div>
  );
}
