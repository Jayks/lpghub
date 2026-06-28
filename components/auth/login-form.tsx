"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Eye, EyeOff, Users, Truck, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { sendOtpAction, verifyOtpAction, signInWithEmailAction } from "@/app/actions/auth";

// Scrolls the focused input into view above the mobile keyboard
function scrollToInput(el: HTMLElement | null) {
  el?.scrollIntoView({ behavior: "smooth", block: "center" });
}

// ─── Test-mode constants (mirrored from server action — not sensitive in dev) ─
const TEST_MODE = process.env.NEXT_PUBLIC_TEST_MODE === "true";
const TEST_OTP = "123456";
const TEST_ADMIN_EMAIL = "admin@lpghub.test";
const TEST_ADMIN_PASSWORD = "Test@lpghub1";
const TEST_CUSTOMER_PHONE = "9876543210";
const TEST_DELIVERY_PHONE = "9999900001";

type Tab = "customer" | "delivery" | "admin";
type Step = "phone" | "otp";

const ROLES: { id: Tab; label: string; tagline: string; icon: React.ElementType }[] = [
  { id: "customer", label: "Customer", tagline: "Order cylinders", icon: Users },
  { id: "delivery", label: "Delivery", tagline: "Track deliveries", icon: Truck },
  { id: "admin",    label: "Admin",    tagline: "Manage platform",  icon: ShieldCheck },
];

export function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [tab,  setTab]  = useState<Tab>("customer");
  const [step, setStep] = useState<Step>("phone");

  // Phone
  const [phone, setPhone] = useState(TEST_MODE ? TEST_CUSTOMER_PHONE : "");

  // OTP — 6-element array drives the split digit boxes
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Refs for phone / email / password — used for programmatic focus
  const phoneRef  = useRef<HTMLInputElement>(null);
  const emailRef  = useRef<HTMLInputElement>(null);
  const pwRef     = useRef<HTMLInputElement>(null);

  // Resend countdown
  const [countdown, setCountdown] = useState(0);
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Admin
  const [email,    setEmail]    = useState(TEST_MODE ? TEST_ADMIN_EMAIL    : "");
  const [password, setPassword] = useState(TEST_MODE ? TEST_ADMIN_PASSWORD : "");
  const [showPw,   setShowPw]   = useState(false);

  // Focus the first field whenever the tab or step changes
  useEffect(() => {
    if (tab === "admin") {
      setTimeout(() => emailRef.current?.focus(), 60);
    } else if (step === "phone") {
      setTimeout(() => phoneRef.current?.focus(), 60);
    }
  }, [tab, step]);

  function handleTabChange(next: Tab) {
    setTab(next);
    setStep("phone");
    setPhone(
      TEST_MODE
        ? next === "delivery" ? TEST_DELIVERY_PHONE
          : next === "customer" ? TEST_CUSTOMER_PHONE
          : ""
        : ""
    );
    setDigits(Array(6).fill(""));
    setCountdown(0);
  }

  // ─── Send OTP ───────────────────────────────────────────────────────────────
  function handleSendOtp(phoneOverride?: string) {
    const p = phoneOverride ?? phone;
    if (p.replace(/\D/g, "").length < 10) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }
    const persona = tab === "delivery" ? "delivery_person" : "customer";
    startTransition(async () => {
      const result = await sendOtpAction(p, persona);
      if (result.ok) {
        setStep("otp");
        setCountdown(30);
        setDigits(Array(6).fill(""));
        setTimeout(() => otpRefs.current[0]?.focus(), 80);
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

  // ─── Phone change — auto-advance when 10 digits are entered ─────────────────
  function handlePhoneChange(val: string) {
    const cleaned = val.replace(/\D/g, "").slice(0, 10);
    setPhone(cleaned);
    if (cleaned.length === 10 && !isPending) handleSendOtp(cleaned);
  }

  // ─── Verify OTP ─────────────────────────────────────────────────────────────
  function handleVerifyOtp(codeOverride?: string) {
    const code = codeOverride ?? digits.join("");
    if (code.length < 4) { toast.error("Enter the OTP"); return; }
    const persona = tab === "delivery" ? "delivery_person" : "customer";
    startTransition(async () => {
      const result = await verifyOtpAction(phone, code, persona);
      if (result.ok) {
        toast.success("Signed in successfully");
        router.refresh();
        router.replace(tab === "delivery" ? "/delivery" : "/");
      } else {
        toast.error(result.error);
      }
    });
  }

  // ─── OTP digit box handlers ──────────────────────────────────────────────────
  function handleDigitChange(index: number, val: string) {
    const d = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = d;
    setDigits(next);
    if (d && index < 5) otpRefs.current[index + 1]?.focus();
    if (next.every(Boolean)) handleVerifyOtp(next.join(""));
  }

  function handleDigitKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = "";
      setDigits(next);
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft"  && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleDigitPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = Array(6).fill("");
    pasted.split("").forEach((c, i) => { next[i] = c; });
    setDigits(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
    if (pasted.length === 6) handleVerifyOtp(pasted);
  }

  // ─── Admin sign-in ──────────────────────────────────────────────────────────
  function handleAdminSignIn() {
    if (!email || !password) { toast.error("Enter email and password"); return; }
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

  const activeRole = ROLES.find((r) => r.id === tab)!;

  return (
    <div className="w-full max-w-md">
      <div className="glass rounded-3xl p-5 sm:p-8 space-y-4 sm:space-y-7">

        {/* ── Logo ──────────────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-2 sm:gap-3 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon.svg"
            alt="LPGHub"
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl shadow-lg shadow-cyan-500/25"
          />
          <div>
            <h1
              className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50"
              style={{ fontFamily: "var(--font-display)" }}
            >
              LPGHub
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              Who are you signing in as?
            </p>
          </div>
        </div>

        {/* ── Test-mode banner ──────────────────────────────────────────────── */}
        {TEST_MODE && (
          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 px-4 py-2.5 text-center">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest">
              Test Mode Active
            </p>
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mt-0.5">
              Phone OTP:{" "}
              <span className="font-mono font-bold">{TEST_OTP}</span>
              {" · "}Admin:{" "}
              <span className="font-mono font-bold">{TEST_ADMIN_EMAIL}</span>
            </p>
          </div>
        )}

        {/* ── Role selector cards ───────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Sign in as">
          {ROLES.map((role) => {
            const Icon = role.icon;
            const isActive = tab === role.id;
            return (
              <button
                key={role.id}
                role="radio"
                aria-checked={isActive}
                onClick={() => handleTabChange(role.id)}
                className={[
                  "flex flex-col items-center gap-1.5 sm:gap-2.5 p-3 sm:p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer select-none",
                  isActive
                    ? "border-cyan-500 bg-cyan-50/80 dark:bg-cyan-900/25 shadow-sm shadow-cyan-200/60 dark:shadow-cyan-900/40"
                    : "border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-white/70 dark:hover:bg-slate-800/60",
                ].join(" ")}
              >
                <div className={[
                  "w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-br from-cyan-500 to-teal-500 shadow-md shadow-cyan-400/30"
                    : "bg-slate-100 dark:bg-slate-700",
                ].join(" ")}>
                  <Icon className={[
                    "w-5 h-5 transition-colors duration-200",
                    isActive ? "text-white" : "text-slate-500 dark:text-slate-400",
                  ].join(" ")} />
                </div>
                <span className={[
                  "text-xs font-bold tracking-wide transition-colors duration-200",
                  isActive ? "text-cyan-700 dark:text-cyan-400" : "text-slate-600 dark:text-slate-400",
                ].join(" ")}>
                  {role.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Contextual divider ────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 whitespace-nowrap">
            {activeRole.tagline}
          </span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
        </div>

        {/* ── Phone OTP flow (Customer / Delivery) ─────────────────────────── */}
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
                      ref={phoneRef}
                      type="tel"
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                      onFocus={(e) => scrollToInput(e.currentTarget)}
                      placeholder="98765 43210"
                      inputMode="numeric"
                      autoComplete="tel"
                      className="flex-1 px-3 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-r-xl text-sm font-medium text-slate-900 dark:text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                    />
                  </div>
                  {TEST_MODE && (
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1.5">
                      Test mode — number pre-filled, will auto-submit
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleSendOtp()}
                  disabled={isPending || phone.replace(/\D/g, "").length < 10}
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
                  onClick={() => { setStep("phone"); setDigits(Array(6).fill("")); setCountdown(0); }}
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Change number
                </button>

                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
                    OTP sent to{" "}
                    <span className="text-cyan-600 dark:text-cyan-400 font-mono">
                      +91 {phone}
                    </span>
                  </p>

                  {/* ── 6 split digit boxes ───────────────────────────────── */}
                  <div className="flex gap-2" role="group" aria-label="One-time password">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        autoComplete={i === 0 ? "one-time-code" : "off"}
                        maxLength={1}
                        value={digits[i]}
                        onChange={(e) => handleDigitChange(i, e.target.value)}
                        onKeyDown={(e) => handleDigitKeyDown(i, e)}
                        onPaste={i === 0 ? handleDigitPaste : undefined}
                        onFocus={(e) => { e.target.select(); scrollToInput(e.currentTarget); }}
                        className={[
                          "flex-1 min-w-0 h-12 text-center text-xl font-bold rounded-xl border-2 transition-all duration-150",
                          "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:outline-none",
                          digits[i]
                            ? "border-cyan-500 bg-cyan-50/50 dark:bg-cyan-900/20"
                            : "border-slate-200 dark:border-slate-700 focus:border-cyan-400 dark:focus:border-cyan-500",
                        ].join(" ")}
                      />
                    ))}
                  </div>

                  {TEST_MODE && (
                    <p className="text-xs font-medium text-center text-amber-600 dark:text-amber-400 mt-2">
                      Test OTP:{" "}
                      <span className="font-mono font-bold">{TEST_OTP}</span>
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleVerifyOtp()}
                  disabled={isPending || digits.join("").length < 4}
                  className="w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-br from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 disabled:opacity-60 text-white transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Verify &amp; Sign In
                </button>

                <button
                  onClick={() => handleSendOtp()}
                  disabled={isPending || countdown > 0}
                  className="w-full text-sm font-medium text-cyan-700 dark:text-cyan-400 hover:underline disabled:opacity-50 disabled:no-underline transition-colors"
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Admin email + password ────────────────────────────────────────── */}
        {tab === "admin" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Email
              </label>
              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); pwRef.current?.focus(); }
                }}
                placeholder="admin@example.com"
                autoComplete="email"
                onFocus={(e) => scrollToInput(e.currentTarget)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  ref={pwRef}
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAdminSignIn(); }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  onFocus={(e) => scrollToInput(e.currentTarget)}
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
                  Test password:{" "}
                  <span className="font-mono font-bold">{TEST_ADMIN_PASSWORD}</span>
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
