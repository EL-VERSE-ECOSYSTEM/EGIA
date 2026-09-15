"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { listenForForegroundMessages, requestNotificationPermission } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/useAuth";

export function useFCM() {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const supported = typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;

  const saveToken = useCallback(async (value: string) => {
    const response = await fetch("/api/fcm/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: value, deviceType: "web", browser: navigator.userAgent, deviceName: navigator.platform }) });
    if (!response.ok) throw new Error("Could not register this device for notifications");
  }, []);

  const requestPermission = useCallback(async () => {
    if (!supported || !user) return null;
    try {
      const value = await requestNotificationPermission();
      setPermission(Notification.permission);
      if (value) { await saveToken(value); setToken(value); }
      return value;
    } catch (error) {
      console.error("Unable to enable push notifications", error);
      return null;
    }
  }, [saveToken, supported, user]);

  const removeToken = useCallback(async () => {
    if (!token) return;
    await fetch("/api/fcm/unregister", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
    setToken(null);
  }, [token]);

  useEffect(() => { if (supported) setPermission(Notification.permission); }, [supported]);
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    void listenForForegroundMessages((payload) => {
      const title = payload.notification?.title || "New Notification";
      const body = payload.notification?.body || "";
      const type = payload.data?.type || "GENERAL";
      const link = payload.data?.link || "/dashboard";

      import("@/lib/notifications").then(({ dispatchMultiChannelNotification }) => {
        dispatchMultiChannelNotification({
          title,
          body,
          type,
          link,
          showToast: true,
          showPopup: true,
          sendDevicePush: false // Foreground already visible
        });
      });
    }).then((fn) => { unsubscribe = fn; });
    return () => unsubscribe?.();
  }, []);
  // Once permission has already been granted, refresh the registration after
  // sign-in so a token rotation is recovered without showing another prompt.
  useEffect(() => { if (user && permission === "granted") void requestPermission(); }, [user, permission, requestPermission]);
  return { token, permission, isSupported: supported, requestPermission, removeToken };
}
