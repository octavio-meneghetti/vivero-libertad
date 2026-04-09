// Custom Service Worker additions for Vivero Libertad
// This file extends the auto-generated SW from next-pwa

self.addEventListener('install', (event) => {
  console.log('[Vivero SW] Installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Vivero SW] Activated');
  event.waitUntil(clients.claim());
});
