import type { Metadata } from "next";
import { TopBar } from "@/components/layout/top-bar";
import { SettingsForm } from "@/components/admin/settings-form";
import { getSettings } from "@/lib/db/queries/settings";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <>
      <TopBar title="Settings" />
      <div className="flex-1 p-4 pb-safe-nav">
        <SettingsForm initial={settings} />
      </div>
    </>
  );
}
