import { useEffect, useState, useCallback } from 'react';
import { getVapidPublicKey, savePushSubscription, removePushSubscription } from '@/services/wireless/push';

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64Safe);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

function isSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

// Only ever silently (re-)subscribe once per page load — AuthGuard mounts
// fresh on every top-level route change (portal switch, page nav), and
// re-checking the subscription on each of those would be wasted work; the
// browser already treats a repeat subscribe() on an active subscription as
// a no-op, but there's no reason to even ask.
let autoSubscribeAttempted = false;

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    isSupported() ? Notification.permission : 'unsupported',
  );
  const [subscribing, setSubscribing] = useState(false);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported()) return false;
    setSubscribing(true);
    try {
      const perm = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return false;

      const registration = await navigator.serviceWorker.ready;
      let sub = await registration.pushManager.getSubscription();
      if (!sub) {
        const publicKey = await getVapidPublicKey();
        if (!publicKey) return false;
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }
      await savePushSubscription(sub);
      return true;
    } catch {
      return false;
    } finally {
      setSubscribing(false);
    }
  }, []);

  const unsubscribe = useCallback(async (): Promise<void> => {
    if (!isSupported()) return;
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.getSubscription();
    if (!sub) return;
    await removePushSubscription(sub.endpoint);
    await sub.unsubscribe();
  }, []);

  // A returning user who already granted permission (and whose browser
  // still has an active subscription, or lost it after clearing site data)
  // gets silently re-subscribed — only ever asks again if permission was
  // never granted in the first place.
  useEffect(() => {
    if (!isSupported() || autoSubscribeAttempted || Notification.permission !== 'granted') return;
    autoSubscribeAttempted = true;
    subscribe();
  }, [subscribe]);

  return { permission, subscribing, subscribe, unsubscribe, isSupported: isSupported() };
}
