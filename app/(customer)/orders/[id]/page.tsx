import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { StatusBadge } from "@/components/shared/status-badge";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import type { OrderStatus } from "@/components/shared/status-badge";
import { getCurrentUser } from "@/lib/db/queries/auth";
import { getCustomerForUser } from "@/lib/db/queries/customers";
import { getCustomerOrderDetail } from "@/lib/db/queries/customer-orders";
import { formatDateTime } from "@/lib/utils/format-date";
import { formatOrderNumber } from "@/lib/utils/format-order-number";
import { CancelOrderButton } from "@/components/customer/cancel-order-button";

export const metadata: Metadata = { title: "Order Details" };

// All statuses in lifecycle order — used to build the timeline
const STATUS_TIMELINE: Array<{ status: OrderStatus; label: string }> = [
  { status: "pending_payment",              label: "Order Placed"          },
  { status: "payment_pending_confirmation", label: "Payment Submitted"     },
  { status: "confirmed",                    label: "Payment Confirmed"     },
  { status: "assigned",                     label: "Delivery Assigned"     },
  { status: "out_for_delivery",             label: "Out for Delivery"      },
  { status: "delivered",                    label: "Delivered"             },
];

const STATUS_ORDER = STATUS_TIMELINE.map((s) => s.status);

function timelineSteps(
  currentStatus: string,
  delivery: { assignedAt: Date | null; dispatchedAt: Date | null; deliveredAt: Date | null } | null,
  paymentConfirmedAt: Date | null,
  orderCreatedAt: Date | null
) {
  if (currentStatus === "cancelled" || currentStatus === "rejected") return [];

  const currentIdx = STATUS_ORDER.indexOf(currentStatus as OrderStatus);

  return STATUS_TIMELINE.map((step, idx) => {
    const done = idx <= currentIdx;
    // Assign timestamps where we have them
    let timestamp: Date | null = null;
    if (step.status === "pending_payment")              timestamp = orderCreatedAt;
    if (step.status === "confirmed" && paymentConfirmedAt) timestamp = paymentConfirmedAt;
    if (step.status === "assigned"   && delivery?.assignedAt)   timestamp = delivery.assignedAt;
    if (step.status === "out_for_delivery" && delivery?.dispatchedAt) timestamp = delivery.dispatchedAt;
    if (step.status === "delivered"  && delivery?.deliveredAt)  timestamp = delivery.deliveredAt;

    return { label: step.label, done, timestamp };
  });
}

export default async function CustomerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const customer = await getCustomerForUser(user.id, user.phone);
  if (!customer) redirect("/");

  const order = await getCustomerOrderDetail(id, customer.id);
  if (!order) notFound();

  const steps = timelineSteps(
    order.status,
    order.delivery,
    order.payment?.confirmedAt ?? null,
    order.createdAt
  );

  const isCancelledOrRejected = order.status === "cancelled" || order.status === "rejected";
  const canPay    = order.status === "pending_payment";
  const canCancel = order.status === "pending_payment";

  return (
    <>
      <TopBar title="Order Details" backHref="/orders" />
      <div className="flex-1 p-4 space-y-4 pb-safe-nav">

        {/* Order header */}
        <div className="glass rounded-2xl p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-bold text-lg text-slate-900 dark:text-slate-50">
                {formatOrderNumber(order.orderNumber)}
              </h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {order.createdAt ? formatDateTime(order.createdAt) : "—"}
              </p>
            </div>
            <StatusBadge status={order.status as OrderStatus} />
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-1.5">
            {order.lineItems.map((l) => (
              <div key={l.label} className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  {l.label} × {l.quantity}
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-50 tabular-nums">
                  ₹{(Number(l.unitPrice) * l.quantity).toLocaleString("en-IN")}
                </span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-bold pt-1 border-t border-slate-100 dark:border-slate-700/50">
              <span className="text-slate-900 dark:text-slate-50">Total</span>
              <span className="text-slate-900 dark:text-slate-50 tabular-nums">
                ₹{Number(order.totalAmount).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* Pay now CTA */}
        {canPay && (
          <Link
            href={`/payments/${order.id}`}
            className="block w-full py-4 rounded-2xl font-bold text-white text-center bg-gradient-to-br from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 transition-all shadow-sm"
          >
            Pay Now · ₹{Number(order.totalAmount).toLocaleString("en-IN")}
          </Link>
        )}

        {/* Payment status */}
        {order.payment && (
          <div className="glass-sm rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Payment</p>
              <p className={`text-sm font-bold ${
                order.payment.status === "confirmed"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : order.payment.status === "rejected"
                  ? "text-red-600 dark:text-red-400"
                  : "text-amber-600 dark:text-amber-400"
              }`}>
                {order.payment.status === "confirmed" ? "Confirmed"
                  : order.payment.status === "rejected" ? "Rejected"
                  : "Pending confirmation"}
              </p>
            </div>
            {order.payment.paymentRef && (
              <div className="text-right">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Reference</p>
                <p className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                  {order.payment.paymentRef}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Cancel order */}
        {canCancel && <CancelOrderButton orderId={order.id} />}

        {/* Cancelled / Rejected banner */}
        {isCancelledOrRejected && (
          <div className="glass-sm rounded-xl p-4 text-center">
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">
              This order was {order.status}
            </p>
          </div>
        )}

        {/* Delivery timeline */}
        {steps.length > 0 && (
          <section>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
              Delivery Timeline
            </h3>
            <div className="glass rounded-2xl p-4">
              <div className="space-y-0">
                {steps.map((step, i) => (
                  <div key={step.label} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      {step.done ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 shrink-0" />
                      )}
                      {i < steps.length - 1 && (
                        <div className="w-0.5 h-8 bg-slate-200 dark:bg-slate-700 my-1" />
                      )}
                    </div>
                    <div className="pb-6 last:pb-0">
                      <p className={`text-sm font-semibold ${
                        step.done
                          ? "text-slate-900 dark:text-slate-50"
                          : "text-slate-400 dark:text-slate-600"
                      }`}>
                        {step.label}
                      </p>
                      {step.done && step.timestamp && (
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(step.timestamp)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
