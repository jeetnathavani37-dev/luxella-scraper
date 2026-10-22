/* Luxella portal service worker: push notifications + offline shell. */
const BASE = new URL('./', self.location).pathname;
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data && e.data.text() }; }
  const title = d.title || 'Luxella';
  e.waitUntil(self.registration.showNotification(title, {
    body: d.body || '', tag: d.tag || 'lx', renotify: true,
    icon: BASE + 'assets/apple-touch-icon.png', badge: BASE + 'assets/badge.png',
    data: { url: /^https?:/.test(d.url || '') ? d.url : BASE + (d.url || '') }, vibrate: [60, 30, 60]
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || BASE;
  if (/^https?:/.test(url) && !url.startsWith(self.location.origin)) { e.waitUntil(self.clients.openWindow(url)); return; }
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if (c.url.startsWith(self.location.origin + BASE) && 'focus' in c) { c.navigate(url); return c.focus(); } }
    return self.clients.openWindow(url);
  }));
});
