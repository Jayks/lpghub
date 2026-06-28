import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { MapPin, ChevronRight, Truck } from "lucide-react";
import { getCurrentUser } from "@/lib/db/queries/auth";
import { getMyDeliveries, getDeliveryPersonByAuthUserId } from "@/lib/db/queries/deliveries";
import { formatOrderNumber } from "@/lib/utils/format-order-number";

export const metadata: Metadata = { title: "My Deliveries" };

export default async function DeliveryHomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [person, deliveries] = await Promise.all([
    getDeliveryPersonByAuthUserId(user.id),
    getMyDeliveries(user.id),
  ]);

  if (!person) {
    return (
      <>
        <TopBar title="My Deliveries" />
        <div className="flex-1 p-4">
          <div className="glass rounded-2xl p-8 text-center space-y-2">
            <Truck className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="font-semibold text-slate-700 dark:text-slate-200">
              Account not linked
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ask your admin to link your phone number to a delivery person account.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title="My Deliveries" />
      <div className="flex-1 p-4 space-y-4">

        {/* Greeting */}
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Hello,</p>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            {person.name} 🚚
          </h2>
        </div>

        {/* Active deliveries */}
        <section>
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
            Assigned to You ({deliveries.length})
          </h3>

          {deliveries.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center space-y-2">
              <Truck className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-slate-600 dark:text-slate-400 font-medium">
                No deliveries assigned right now
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {deliveries.map((d) => (
                <Link
                  key={d.assignmentId}
                  href={`/delivery/deliveries/${d.assignmentId}`}
                  className="glass rounded-2xl p-4 block space-y-2 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-slate-50">
                        {d.businessName}
                      </p>
                      <p className="text-xs font-mono font-semibold text-cyan-700 dark:text-cyan-400 mt-0.5">
                        {formatOrderNumber(d.orderNumber)}
                        {d.linesSummary && ` · ${d.linesSummary}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        d.status === "out_for_delivery"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400"
                      }`}>
                        {d.status === "out_for_delivery" ? "Out for Delivery" : "Assigned"}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{d.address}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
