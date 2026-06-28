import type { Metadata } from "next";
import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { PageWrapper } from "@/components/shared/page-wrapper";
import { EmptyState } from "@/components/shared/empty-state";
import { AssignDeliveryForm } from "@/components/admin/assign-delivery-form";
import { DeliveryPersonToggle } from "@/components/admin/delivery-person-toggle";
import { getUnassignedOrders, getActiveDeliveries, getDeliveryPersons, getAllDeliveryPersons } from "@/lib/db/queries/deliveries";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate } from "@/lib/utils/format-date";
import { formatOrderNumber } from "@/lib/utils/format-order-number";
import { UserPlus, Phone, Pencil, Package, Truck, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "Delivery Assignments" };

export default async function AdminDeliveriesPage() {
  const [unassigned, active, deliveryPersons, allPersons] = await Promise.all([
    getUnassignedOrders(),
    getActiveDeliveries(),
    getDeliveryPersons(),
    getAllDeliveryPersons(),
  ]);

  return (
    <>
      <TopBar title="Deliveries" />
      <PageWrapper className="flex-1 p-4 space-y-5">

        {/* Unassigned confirmed orders */}
        <section>
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
            Awaiting Assignment ({unassigned.length})
          </h3>

          {unassigned.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="Nothing to assign"
              description="Confirmed orders will appear here for delivery assignment."
              compact
            />
          ) : (
            <div className="space-y-3">
              {unassigned.map((order) => (
                <div key={order.orderId} className="glass rounded-2xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-slate-50">{order.businessName}</p>
                      <p className="text-xs font-mono font-semibold text-cyan-700 dark:text-cyan-400 mt-0.5">
                        {formatOrderNumber(order.orderNumber)}
                      </p>
                      {order.linesSummary && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
                          <Package className="w-3 h-3 text-slate-400 shrink-0" />
                          {order.linesSummary}
                        </div>
                      )}
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-500 mt-0.5 truncate">
                        {order.address}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-slate-50">
                        {formatCurrency(order.totalAmount)}
                      </span>
                      {order.createdAt && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {formatDate(order.createdAt)}
                        </p>
                      )}
                    </div>
                  </div>

                  {deliveryPersons.length === 0 ? (
                    <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                      No active delivery persons — add one first
                    </p>
                  ) : (
                    <AssignDeliveryForm orderId={order.orderId} deliveryPersons={deliveryPersons} />
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Assigned / in-progress */}
        <section>
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
            In Progress ({active.length})
          </h3>

          {active.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="No active deliveries"
              description="In-progress deliveries will appear here."
              compact
            />
          ) : (
            <div className="space-y-2">
              {active.map((d) => (
                <Link key={d.assignmentId} href={`/admin/orders/${d.orderId}?from=deliveries`}
                  className="glass-sm rounded-xl px-4 py-3 flex items-center gap-3 active:scale-[0.98] active:opacity-80 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-50">{d.businessName}</p>
                    <p className="text-xs font-mono font-semibold text-cyan-700 dark:text-cyan-400">
                      {formatOrderNumber(d.orderNumber)}
                    </p>
                    {d.linesSummary && (
                      <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                        <Package className="w-3 h-3 shrink-0" />
                        {d.linesSummary}
                      </div>
                    )}
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {formatCurrency(d.totalAmount)}
                      {d.assignedAt ? ` · ${formatDate(d.assignedAt)}` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {d.deliveryPersonName}
                    </p>
                    <p className={cn(
                      "text-xs font-semibold",
                      d.status === "out_for_delivery"
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-cyan-600 dark:text-cyan-400"
                    )}>
                      {d.status === "out_for_delivery" ? "Out for Delivery" : "Assigned"}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Delivery team */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Delivery Team ({allPersons.length})
            </h3>
            <Link
              href="/admin/deliveries/persons/new"
              className="flex items-center gap-1.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add Person
            </Link>
          </div>

          {allPersons.length === 0 ? (
            <EmptyState
              icon={UserPlus}
              title="No delivery persons yet"
              description="Add your first delivery person to start assigning orders."
              compact
              action={
                <Link
                  href="/admin/deliveries/persons/new"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
                >
                  <UserPlus className="w-4 h-4" />
                  Add delivery person
                </Link>
              }
            />
          ) : (
            <div className="space-y-2">
              {allPersons.map((person) => (
                <div key={person.id} className="glass-sm rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-50">{person.name}</p>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" />
                      {person.phone}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/admin/deliveries/persons/${person.id}/edit`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      aria-label={`Edit ${person.name}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <DeliveryPersonToggle id={person.id} isActive={person.isActive} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </PageWrapper>
    </>
  );
}
