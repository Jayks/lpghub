"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";
import { subscribeToPush } from "@/lib/notifications/subscribe";
import { savePushSubscription, deleteMyPushSubscription } from "@/app/actions/push";

type PermState = "default" | "granted" | "denied" | "unsupported";

export function NotificationToggle() {
  const [perm, setPerm] = useState<PermState>("default");
  const [isOn, setIsOn] = useState(false);
  const [endpoint, setEndpoint] = useState<string | null>(null);

  // Resolve current permission + existing subscription on mount
  useEffect(() => {
    if (
      !("Notification" in window) ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      setPerm("unsupported");
      return;
    }

    const currentPerm = Notification.permission as PermState;
    setPerm(currentPerm);

    if (currentPerm !== "granted") return;

    // If already granted, check whether this device has an active subscription
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        if (sub) {
          setIsOn(true);
          setEndpoint(sub.endpoint);
        }
      });
    });
  }, []);

  async function handleToggle() {
    // Optimistic update — flip immediately, roll back on error
    const wasOn = isOn;
    setIsOn(!wasOn);

    try {
      if (wasOn && endpoint) {
        // ── Turn OFF ──────────────────────────────────────────────────────────
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
        await deleteMyPushSubscription(endpoint);
        setEndpoint(null);
      } else {
        // ── Turn ON ───────────────────────────────────────────────────────────
        await navigator.serviceWorker.register("/sw.js");
        const sub = await subscribeToPush(); // prompts only if permission is "default"
        if (!sub) {
          // User denied — roll back and update perm state
          setIsOn(false);
          setPerm(Notification.permission as PermState);
          return;
        }
        const json = sub.toJSON();
        const ep = json.endpoint;
        const p256dh = json.keys?.p256dh;
        const auth = json.keys?.auth;
        if (ep && p256dh && auth) {
          await savePushSubscription({ endpoint: ep, p256dh, auth });
          setEndpoint(ep);
        }
        setPerm("granted");
      }
    } catch {
      setIsOn(wasOn); // roll back on unexpected error
    }
  }

  if (perm === "unsupported") {
    return (
      <div className="glass-sm rounded-xl p-4 flex items-center gap-3">
        <BellOff className="w-5 h-5 text-slate-400 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Push Notifications
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Not supported in this browser. Try Chrome or Edge.
          </p>
        </div>
      </div>
    );
  }

  const blocked = perm === "denied";

  return (
    <div className="glass-sm rounded-xl p-4 flex items-center justify-between gap-4">
      {/* Label */}
      <div className="flex items-center gap-3 min-w-0">
        {isOn ? (
          <Bell className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
        ) : (
          <BellOff className="w-5 h-5 text-slate-400 shrink-0" />
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Push Notifications
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {blocked
              ? "Blocked — enable in your browser site settings"
              : isOn
              ? "You'll be notified of order updates"
              : "Get notified of order and delivery updates"}
          </p>
        </div>
      </div>

      {/* Toggle switch */}
      {!blocked && (
        <button
          role="switch"
          aria-checked={isOn}
          aria-label="Push notifications"
          onClick={handleToggle}
          className="shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
          style={{
            backgroundColor: isOn ? "rgb(8 145 178)" : "rgb(203 213 225)",
          }}
        >
          <span
            className="inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200"
            style={{ transform: isOn ? "translateX(22px)" : "translateX(2px)" }}
          />
        </button>
      )}

      {blocked && (
        <span className="shrink-0 text-xs font-medium text-slate-400">
          Blocked
        </span>
      )}
    </div>
  );
}
