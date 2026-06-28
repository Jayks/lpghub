import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { StatusBadge } from "@/components/shared/status-badge";
import { MapPin, Phone, User } from "lucide-react";
import type { OrderStatus } from "@/components/shared/status-badge";
import { getAdminOrderDetail } from "@/lib/db/queries/admin-order-detail";
import { PaymentActionButtons } from "@/components/admin/payment-action-buttons";
import { formatDateTime, formatDate } from "@/lib/utils/format-date";
import { formatOrderNumber } from "@/lib/utils/format-order-number";

export const metadata: Metadata = { title: "Order Detail" };

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getAdminOrderDetail(id);
  if (!order) notFound();

  const canConfirmPayment =
    order.status === "payment_pending_confirmation" && !!order.payment;

  return (
    <>
      <TopBar title="Order Detail" backHref="/admin/orders" />
      <div className="flex-1 p-4 space-y-4">

        {/* Order summary */}
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

          {/* Line items */}
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
            <div className="flex justify-between text-sm font-bold border-t border-slate-100 dark:border-slate-800 pt-1.5">
              <span className="text-slate-900 dark:text-slate-50">Total</span>
              <span className="text-slate-900 dark:text-slate-50 tabular-nums">
                ₹{Number(order.totalAmount).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* Customer details */}
        <div className="glass-sm rounded-xl p-4 space-y-2">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
            Customer
          </p>
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-900 dark:text-slate-50">
              {order.customer.businessName}
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              · {order.customer.contactPerson}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
            <a
              href={`tel:${order.customer.phone}`}
              className="font-medium text-cyan-700 dark:text-cyan-400 hover:underline"
            >
              {order.customer.phone}
            </a>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span className="text-slate-600 dark:text-slate-400">{order.customer.address}</span>
          </div>
        </div>

        {/* Payment details */}
        {order.payment && (
          <div className="glass-sm rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Payment
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Status</p>
                <p className={`font-semibold ${
                  order.payment.status === "confirmed"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : order.payment.status === "rejected"
                    ? "text-red-600 dark:text-red-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}>
                  {order.payment.status === "confirmed" ? "Confirmed"
                    : order.payment.status === "rejected" ? "Rejected"
                    : "Pending Confirmation"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Amount</p>
                <p className="font-bold text-slate-900 dark:text-slate-50 tabular-nums">
                  ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                </p>
              </div>
              {order.payment.paymentRef && (
                <div className="col-span-2">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    UPI Reference (customer-reported)
                  </p>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
                    <p className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-50">
                      {order.payment.paymentRef}
                    </p>
                  </div>
                </div>
              )}
              {order.payment.confirmedAt && (
                <div className="col-span-2">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Confirmed at</p>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {formatDateTime(order.payment.confirmedAt)}
                  </p>
                </div>
              )}
            </div>

            {canConfirmPayment && (
              <div className="pt-1">
                <PaymentActionButtons
                  paymentId={order.payment.id}
                  orderId={order.id}
                  existingRef={order.payment.paymentRef}
                />
              </div>
            )}
          </div>
        )}

        {/* Delivery */}
        <div className="glass-sm rounded-xl p-4 space-y-2">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
            Delivery
          </p>
          {order.delivery ? (
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Assigned to</span>
                <span className="font-semibold text-slate-900 dark:text-slate-50">
                  {order.delivery.personName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Status</span>
                <StatusBadge status={order.delivery.status as OrderStatus} />
              </div>
              {order.delivery.assignedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Assigned</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {formatDate(order.delivery.assignedAt)}
                  </span>
                </div>
              )}
              {order.delivery.deliveredAt && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Delivered</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {formatDateTime(order.delivery.deliveredAt)}
                  </span>
                </div>
              )}
              {order.delivery.remarks && (
                <div className="pt-1">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Remarks</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{order.delivery.remarks}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {["confirmed"].includes(order.status)
                ? "Ready to assign — go to Deliveries"
                : "Not yet assigned"}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
