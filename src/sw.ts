/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

// injectManifest mode (not generateSW) — needed to add the push handlers
// below, which generateSW's auto-built service worker has no hook for.
// __WB_MANIFEST is replaced at build time with the precache file list.
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
self.skipWaiting();
clientsClaim();

interface PushPayload {
  title?: string;
  body?: string;
  url?: string;
}

// notify_push_on_audit_log() (see the wireless.push_subscriptions
// migration) sends { title, body, url } as the notification payload.
self.addEventListener('push', (event: PushEvent) => {
  let data: PushPayload = {};
  try { data = event.data?.json() ?? {}; } catch { /* non-JSON payload, ignore */ }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Wireless', {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: data.url || '/' },
    }),
  );
});

// Focuses an already-open tab on the target route if one exists, instead
// of always opening a new one — a technician tapping a "your ticket
// updated" push shouldn't end up with five app tabs.
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string } | undefined)?.url || '/';

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clientList) {
        if (new URL(client.url).pathname === url && 'focus' in client) {
          await client.focus();
          return;
        }
      }
      const anyClient = clientList[0];
      if (anyClient && 'focus' in anyClient && 'navigate' in anyClient) {
        await anyClient.focus();
        await (anyClient as WindowClient).navigate(url);
        return;
      }
      await self.clients.openWindow(url);
    })(),
  );
});
