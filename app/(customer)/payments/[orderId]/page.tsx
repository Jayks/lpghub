import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { TopBar } from "@/components/layout/top-bar";
import { Smartphone } from "lucide-react";
import { CopyButton } from "@/components/shared/copy-button";
import { PageWrapper } from "@/components/shared/page-wrapper";
import { getOrderPaymentDetail } from "@/lib/db/queries/payments";
import { ReportPaymentForm } from "@/components/customer/report-payment-form";
import { formatCurrency } from "@/lib/utils/format-currency";

export const metadata: Metadata = { title: "Payment" };

const UPI_VPA      = process.env.NEXT_PUBLIC_UPI_VPA      ?? "agency@upi";
const UPI_MERCHANT = process.env.NEXT_PUBLIC_UPI_MERCHANT_NAME ?? "LPGHub";

function buildUpiLink(orderId: string, amount: string): string {
  const params = new URLSearchParams({
    pa:  UPI_VPA,
    pn:  UPI_MERCHANT,
    am:  amount,
    tr:  orderId,
    tn:  "LPGHub Order",
    cu:  "INR",
  });
  return `upi://pay?${params.toString()}`;
}

function buildGpayLink(orderId: string, amount: string): string {
  const base = buildUpiLink(orderId, amount);
  return `intent://${base.slice(6)}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`;
}

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const detail = await getOrderPaymentDetail(orderId);

  if (!detail) notFound();

  const amount    = Number(detail.totalAmount);
  const amountStr = amount.toFixed(2);
  const gpayLink  = buildGpayLink(orderId, amountStr);
  const upiLink   = buildUpiLink(orderId, amountStr);

  // Generate QR code as base64 data URL (server-side — no client bundle impact)
  const qrDataUrl = await QRCode.toDataURL(upiLink, {
    width:  200,
    margin: 2,
    color:  { dark: "#0F172A", light: "#FFFFFF" },
    errorCorrectionLevel: "M",
  });

  const alreadyReported = detail.orderStatus === "payment_pending_confirmation";
  const isPaid = ["confirmed", "assigned", "out_for_delivery", "delivered"].includes(
    detail.orderStatus
  );

  // Summarise line items as "2× 15 kg, 1× 17 kg"
  const linesSummary = detail.lineItems
    .map((l) => `${l.quantity}× ${l.label}`)
    .join(", ");

  return (
    <>
      <TopBar title="Pay for Order" backHref="/orders" />
      <PageWrapper className="flex-1 p-4 space-y-5">

        {/* Amount card */}
        <div className="glass rounded-3xl p-6 text-center space-y-1">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Amount to pay</p>
          <p className="text-4xl font-bold text-slate-900 dark:text-slate-50 tabular-nums">
            {formatCurrency(amount)}
          </p>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-500">
            {detail.businessName}{linesSummary ? ` · ${linesSummary}` : ""}
          </p>
        </div>

        {isPaid ? (
          <div className="glass rounded-2xl p-6 text-center space-y-2">
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              ✓ Payment {detail.orderStatus === "confirmed" ? "confirmed" : "recorded"}
            </p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Order status: {detail.orderStatus.replace(/_/g, " ")}
            </p>
          </div>
        ) : (
          <>
            {/* GPay button */}
            <a
              href={gpayLink}
              className="flex w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-br from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 transition-all shadow-sm text-center items-center justify-center gap-2"
            >
              <Smartphone className="w-5 h-5" />
              Pay with Google Pay
            </a>

            {/* Manual UPI */}
            <div className="glass-sm rounded-2xl p-5 space-y-4">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Or pay manually via UPI
              </p>

              {/* UPI VPA row */}
              <div className="flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">UPI ID</p>
                  <p className="text-sm font-mono font-bold text-slate-900 dark:text-slate-50">
                    {UPI_VPA}
                  </p>
                </div>
                <CopyButton text={UPI_VPA} />
              </div>

              {/* Real QR code */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-44 h-44 rounded-2xl bg-white border border-slate-200 dark:border-slate-700 flex items-center justify-center p-2 shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrDataUrl}
                    alt="UPI QR code"
                    className="w-full h-full rounded-xl"
                    width={160}
                    height={160}
                  />
                </div>
                <p className="text-xs text-center font-medium text-slate-500 dark:text-slate-400">
                  Scan with any UPI app (PhonePe, Paytm, BHIM, Google Pay)
                </p>
              </div>
            </div>

            {/* Report payment */}
            <ReportPaymentForm orderId={orderId} alreadyReported={alreadyReported} />
          </>
        )}
      </PageWrapper>
    </>
  );
}
