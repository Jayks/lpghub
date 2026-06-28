"use client";

import { useEffect } from "react";
import { subscribeToPush } from "@/lib/notifications/subscribe";
import { savePushSubscription } from "@/app/actions/push";

/**
 * PushRegistrar — mounts invisibly in authenticated layouts.
 *
 * Registers the service worker silently on every load (idempotent).
 * If the user has already granted notification permission, re-syncs
 * their subscription to the DB in case it was lost or rotated.
 *
 * Does NOT prompt for permission — that is handled by NotificationToggle
 * in the settings UI for each persona.
 */
export function PushRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then(async () => {
        // Only sync if permission already granted — never auto-prompt
        if (Notification.permission !== "granted") return;

        const sub = await subscribeToPush();
        if (!sub) return;

        const json = sub.toJSON();
        const endpoint = json.endpoint;
        const p256dh = json.keys?.p256dh;
        const auth = json.keys?.auth;

        if (!endpoint || !p256dh || !auth) return;

        await savePushSubscription({ endpoint, p256dh, auth });
      })
      .catch(() => {
        // Silently ignore — SW may not work over plain HTTP in dev
      });
  }, []);

  return null;
}
