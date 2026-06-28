import type { Metadata } from "next";
import { TopBar } from "@/components/layout/top-bar";
import { PageWrapper } from "@/components/shared/page-wrapper";
import { SettingsForm } from "@/components/admin/settings-form";
import { NotificationToggle } from "@/components/shared/notification-toggle";
import { getSettings } from "@/lib/db/queries/settings";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <>
      <TopBar title="Settings" />
      <PageWrapper className="flex-1 p-4 pb-safe-nav space-y-6">
        <SettingsForm initial={settings} />

        <section className="space-y-2">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Notifications
          </h2>
          <div className="glass-sm rounded-xl px-4 py-3">
            <NotificationToggle />
          </div>
        </section>
      </PageWrapper>
    </>
  );
}
