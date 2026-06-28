import type { Metadata } from "next";
import { TopBar } from "@/components/layout/top-bar";
import { PageWrapper } from "@/components/shared/page-wrapper";
import { NotificationToggle } from "@/components/shared/notification-toggle";

export const metadata: Metadata = { title: "Settings" };

export default function CustomerSettingsPage() {
  return (
    <>
      <TopBar title="Settings" />
      <PageWrapper className="flex-1 p-4 pb-safe-nav space-y-6">
        <section className="space-y-2">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Notifications
          </h2>
          <NotificationToggle />
        </section>
      </PageWrapper>
    </>
  );
}
