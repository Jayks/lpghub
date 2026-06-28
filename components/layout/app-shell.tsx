import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";

interface AppShellProps {
  children: React.ReactNode;
  /** Pending-payment orders — badge on Payments nav item. */
  urgentCount?: number;
  /** Confirmed orders with no delivery assignment — badge on Deliveries nav item. */
  deliveryUrgentCount?: number;
}

export function AppShell({ children, urgentCount = 0, deliveryUrgentCount = 0 }: AppShellProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar urgentCount={urgentCount} deliveryUrgentCount={deliveryUrgentCount} />
      <main className="flex-1 flex flex-col pb-safe-nav md:pb-0 overflow-x-hidden">
        {children}
      </main>
      <BottomNav urgentCount={urgentCount} />
    </div>
  );
}
