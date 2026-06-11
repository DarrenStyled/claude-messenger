// Minimal service worker — exists so the app is installable on phones
// (Add to Home Screen). All requests go straight to the network; a chat
// app has nothing useful to show offline.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
