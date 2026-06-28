import { AppShell } from "@/components/layout/app-shell";
import { PushRegistrar } from "@/components/shared/push-registrar";
import { getAdminUrgentCounts } from "@/lib/db/queries/admin-stats";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { payments, deliveries } = await getAdminUrgentCounts();

  return (
    <AppShell urgentCount={payments} deliveryUrgentCount={deliveries}>
      <PushRegistrar />
      {children}
    </AppShell>
  );
}
