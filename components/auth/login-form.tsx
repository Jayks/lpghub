"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Flame, Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { sendOtpAction, verifyOtpAction, signInWithEmailAction } from "@/app/actions/auth";

// ─── Test-mode constants (mirrored from server action — not sensitive in dev) ─
const TEST_MODE = process.env.NEXT_PUBLIC_TEST_MODE === "true";
const TEST_OTP = "123456";
const TEST_ADMIN_EMAIL = "admin@lpghub.test";
const TEST_ADMIN_PASSWORD = "Test@lpghub1";

type Tab = "customer" | "delivery" | "admin";
type Step = "phone" | "otp";

export function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [tab, setTab] = useState<Tab>("customer");
  const [step, setStep] = useState<Step>("phone");

  // Phone OTP fields
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  // Admin fields
  const [email, setEmail] = useState(TEST_MODE ? TEST_ADMIN_EMAIL : "");
  const [password, setPassword] = useState(TEST_MODE ? TEST_ADMIN_PASSWORD : "");
  const [showPw, setShowPw] = useState(false);

  function handleTabChange(next: Tab) {
    setTab(next);
    setStep("phone");
    setPhone("");
    setOtp("");
  }

  // ─── Send OTP ───────────────────────────────────────────────────────────────
  function handleSendOtp() {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }
    const persona = tab === "delivery" ? "delivery_person" : "customer";
    startTransition(async () => {
      const result = await sendOtpAction(phone, persona);
      if (result.ok) {
        setStep("otp");
        if (result.testMode) {
          toast.info(result.hint ?? "Test mode — use OTP 123456");
        } else {
          toast.success("OTP sent to your number");
        }
      } else {
        toast.error(result.error);
      }
    });
  }

  // ─── Verify OTP ─────────────────────────────────────────────────────────────
  function handleVerifyOtp() {
    if (otp.length < 4) {
      toast.error("Enter the OTP");
      return;
    }
    const persona = tab === "delivery" ? "delivery_person" : "customer";
    startTransition(async () => {
      const result = await verifyOtpAction(phone, otp, persona);
      if (result.ok) {
        toast.success("Signed in successfully");
        router.refresh();
        router.replace(tab === "delivery" ? "/delivery" : "/");
      } else {
        toast.error(result.error);
      }
    });
  }

  // ─── Admin sign-in ──────────────────────────────────────────────────────────
  function handleAdminSignIn() {
    if (!email || !password) {
      toast.error("Enter email and password");
      return;
    }
    startTransition(async () => {
      const result = await signInWithEmailAction(email, password);
      if (result.ok) {
        toast.success("Signed in as admin");
        router.refresh();
        router.replace("/admin");
      } else {
        toast.error(result.error);
      }
    });
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "customer", label: "Customer" },
    { id: "delivery", label: "Delivery" },
    { id: "admin", label: "Admin" },
  ];

  return (
    <div className="w-full max-w-md">
      <div className="glass rounded-3xl p-8 space-y-6">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-sm">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1
              className="text-2xl font-bold text-slate-900 dark:text-slate-50"
              style={{ fontFamily: "var(--font-display)" }}
            >
              LPGHub
            </h1>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Sign in to continue
            </p>
          </div>
        </div>

        {/* Test-mode banner */}
        {TEST_MODE && (
          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 px-4 py-2.5 text-center">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest">
              Test Mode Active
            </p>
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mt-0.5">
              Phone OTP: <span className="font-mono font-bold">{TEST_OTP}</span>
              {" · "}Admin: <span className="font-mono font-bold">{TEST_ADMIN_EMAIL}</span>
            </p>
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                tab === t.id
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Phone OTP flow (Customer / Delivery) ── */}
        {(tab === "customer" || tab === "delivery") && (
          <>
            {step === "phone" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Mobile number
                  </label>
                  <div className="flex">
                    <span className="flex items-center px-3 border border-r-0 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 rounded-l-xl text-slate-700 dark:text-slate-300 text-sm font-semibold select-none">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="98765 43210"
                      inputMode="numeric"
                      autoComplete="tel"
                      className="flex-1 px-3 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-r-xl text-sm font-medium text-slate-900 dark:text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                    />
                  </div>
                  {TEST_MODE && (
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1.5">
                      Test mode — enter any 10-digit number
                    </p>
                  )}
                </div>

                <button
                  onClick={handleSendOtp}
                  disabled={isPending}
                  className="w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-br from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 disabled:opacity-60 text-white transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Send OTP
                </button>
              </div>
            )}

            {step === "otp" && (
              <div className="space-y-4">
                <button
                  onClick={() => { setStep("phone"); setOtp(""); }}
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Change number
                </button>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Enter OTP sent to +91 {phone}
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-lg font-bold text-slate-900 dark:text-slate-50 placeholder-slate-400 tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-cyan-500/40 tabular"
                  />
                  {TEST_MODE && (
                    <p className="text-xs font-medium text-center text-amber-600 dark:text-amber-400 mt-1.5">
                      Test OTP: <span className="font-mono font-bold">{TEST_OTP}</span>
                    </p>
                  )}
                </div>

                <button
                  onClick={handleVerifyOtp}
                  disabled={isPending || otp.length < 4}
                  className="w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-br from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 disabled:opacity-60 text-white transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Verify &amp; Sign In
                </button>

                <button
                  onClick={handleSendOtp}
                  disabled={isPending}
                  className="w-full text-sm font-medium text-cyan-700 dark:text-cyan-400 hover:underline disabled:opacity-50 transition-colors"
                >
                  Resend OTP
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Admin email + password ── */}
        {tab === "admin" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                autoComplete="email"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {TEST_MODE && (
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mt-1.5">
                  Test password: <span className="font-mono font-bold">{TEST_ADMIN_PASSWORD}</span>
                </p>
              )}
            </div>

            <button
              onClick={handleAdminSignIn}
              disabled={isPending}
              className="w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-br from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 disabled:opacity-60 text-white transition-all shadow-sm flex items-center justify-center gap-2"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Sign In
            </button>
          </div>
        )}

        <p className="text-center text-xs font-medium text-slate-500 dark:text-slate-400">
          By continuing, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}
