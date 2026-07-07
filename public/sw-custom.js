/**
 * Custom service worker additions for background sync.
 * Imported by the Workbox-generated service worker.
 * v3
 */

// Handle background sync events
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-ops') {
    event.waitUntil(notifyClientsToSync());
  }
});

/**
 * Notify all open clients to trigger sync.
 * The actual sync logic runs in the main thread where Firebase SDK is available.
 */
async function notifyClientsToSync() {
  const clients = await self.clients.matchAll({ type: 'window' });
  for (const client of clients) {
    client.postMessage({ type: 'SYNC_REQUESTED' });
  }
}
