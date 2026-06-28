import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { MapPin, Package } from "lucide-react";
import { getDeliveryDetail } from "@/lib/db/queries/deliveries";
import { DeliveryStatusButtons } from "@/components/delivery/delivery-status-buttons";
import { formatDate } from "@/lib/utils/format-date";

export const metadata: Metadata = { title: "Delivery Detail" };

export default async function DeliveryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getDeliveryDetail(id);

  if (!detail) notFound();

  const linesSummary = detail.lineItems
    .map((l) => `${l.quantity}× ${l.label}`)
    .join(", ");

  return (
    <>
      <TopBar title="Delivery Detail" backHref="/delivery" />
      <div className="flex-1 p-4 space-y-4">

        {/* Order summary */}
        <div className="glass rounded-2xl p-5 space-y-3">
          <div>
            <h2 className="font-bold text-lg text-slate-900 dark:text-slate-50">
              {detail.businessName}
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Assigned {detail.assignedAt ? formatDate(detail.assignedAt) : "—"}
            </p>
          </div>

          {linesSummary && (
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <Package className="w-4 h-4 text-slate-400" />
              {linesSummary}
            </div>
          )}

          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {detail.address}
            </p>
          </div>
        </div>

        {/* Customer contact */}
        <div className="glass-sm rounded-xl p-4 space-y-1">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Contact
          </p>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-50">
            {detail.contactPerson}
          </p>
          <a
            href={`tel:${detail.phone}`}
            className="text-sm font-semibold text-cyan-700 dark:text-cyan-400 hover:underline"
          >
            {detail.phone}
          </a>
        </div>

        {/* Status action buttons */}
        <DeliveryStatusButtons
          assignmentId={detail.assignmentId}
          status={detail.status}
        />
      </div>
    </>
  );
}
