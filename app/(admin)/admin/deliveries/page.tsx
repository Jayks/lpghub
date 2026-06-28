import type { Metadata } from "next";
import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { AssignDeliveryForm } from "@/components/admin/assign-delivery-form";
import { DeliveryPersonToggle } from "@/components/admin/delivery-person-toggle";
import { getUnassignedOrders, getActiveDeliveries, getDeliveryPersons, getAllDeliveryPersons } from "@/lib/db/queries/deliveries";
import { formatDate } from "@/lib/utils/format-date";
import { formatOrderNumber } from "@/lib/utils/format-order-number";
import { UserPlus, Phone } from "lucide-react";

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
      <div className="flex-1 p-4 space-y-5">

        {/* Unassigned confirmed orders */}
        <section>
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
            Awaiting Assignment ({unassigned.length})
          </h3>

          {unassigned.length === 0 && (
            <div className="glass-sm rounded-xl px-4 py-5 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
              No orders waiting for assignment
            </div>
          )}

          <div className="space-y-3">
            {unassigned.map((order) => (
              <div key={order.orderId} className="glass rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-slate-50">{order.businessName}</p>
                    <p className="text-xs font-mono font-semibold text-cyan-700 dark:text-cyan-400 mt-0.5">
                      {formatOrderNumber(order.orderNumber)}
                    </p>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5">
                      {order.createdAt ? formatDate(order.createdAt) : "—"}
                    </p>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-500 mt-0.5 truncate">
                      {order.address}
                    </p>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-slate-50 shrink-0">
                    ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                  </span>
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
        </section>

        {/* Assigned / in-progress */}
        <section>
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
            In Progress ({active.length})
          </h3>

          {active.length === 0 && (
            <div className="glass-sm rounded-xl px-4 py-5 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
              No active deliveries
            </div>
          )}

          <div className="space-y-2">
            {active.map((d) => (
              <div key={d.assignmentId} className="glass-sm rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-50">{d.businessName}</p>
                  <p className="text-xs font-mono font-semibold text-cyan-700 dark:text-cyan-400">
                    {formatOrderNumber(d.orderNumber)}
                  </p>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    ₹{Number(d.totalAmount).toLocaleString("en-IN")} ·{" "}
                    {d.assignedAt ? formatDate(d.assignedAt) : "—"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {d.deliveryPersonName}
                  </p>
                  <p
                    className={`text-xs font-semibold ${
                      d.status === "out_for_delivery"
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-cyan-600 dark:text-cyan-400"
                    }`}
                  >
                    {d.status === "out_for_delivery" ? "Out for Delivery" : "Assigned"}
                  </p>
                </div>
              </div>
            ))}
          </div>
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
            <div className="glass-sm rounded-xl px-4 py-5 text-center space-y-2">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                No delivery persons yet
              </p>
              <Link
                href="/admin/deliveries/persons/new"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                <UserPlus className="w-4 h-4" />
                Add your first delivery person
              </Link>
            </div>
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
                  <DeliveryPersonToggle id={person.id} isActive={person.isActive} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
