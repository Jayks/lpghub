import { AppShell } from "@/components/layout/app-shell";
import { PushRegistrar } from "@/components/shared/push-registrar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <PushRegistrar />
      {children}
    </AppShell>
  );
}
