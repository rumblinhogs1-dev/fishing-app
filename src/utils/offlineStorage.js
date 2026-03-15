/**
 * IndexedDB-backed offline storage for catches, spots, and tackle box.
 * Includes a general-purpose pending operations queue for offline creates,
 * updates, and deletes that sync when back online.
 */

const DB_NAME = 'fishingAppOffline';
const DB_VERSION = 2;
const STORES = {
  catches: 'catches',
  spots: 'spots',
  tackle: 'tackle',
  pendingCatches: 'pendingCatches',
  pendingOps: 'pendingOps',
};

let dbInstance = null;
let dbPromise = null;

function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance);
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      Object.values(STORES).forEach((name) => {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: 'id' });
        }
      });
    };
    req.onsuccess = () => {
      dbInstance = req.result;
      dbInstance.onclose = () => { dbInstance = null; dbPromise = null; };
      dbPromise = null;
      resolve(dbInstance);
    };
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  });

  return dbPromise;
}

async function getAll(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function putAll(storeName, items) {
  const db = await openDB();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  store.clear();
  items.forEach((item) => store.put(item));
  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function putOne(storeName, item) {
  const db = await openDB();
  const tx = db.transaction(storeName, 'readwrite');
  tx.objectStore(storeName).put(item);
  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function deleteOne(storeName, id) {
  const db = await openDB();
  const tx = db.transaction(storeName, 'readwrite');
  tx.objectStore(storeName).delete(id);
  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

// --- Cache API (unchanged) ---

export async function cacheCatches(catches) {
  await putAll(STORES.catches, catches.slice(0, 50));
}

export async function getCachedCatches() {
  return getAll(STORES.catches);
}

export async function cacheSpots(spots) {
  await putAll(STORES.spots, spots);
}

export async function getCachedSpots() {
  return getAll(STORES.spots);
}

export async function cacheTackle(items) {
  await putAll(STORES.tackle, items);
}

export async function getCachedTackle() {
  return getAll(STORES.tackle);
}

// --- Legacy pending catches (kept for backward compat) ---

export async function addPendingCatch(catchData) {
  const pending = {
    ...catchData,
    id: `pending_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    pendingSync: true,
    createdAt: new Date().toISOString(),
  };
  await putOne(STORES.pendingCatches, pending);
  // Also add to the general ops queue
  await addPendingOp({
    type: 'create',
    collection: 'catches',
    docId: null,
    data: catchData,
    userId: catchData.userId || null,
  });
  return pending;
}

export async function getPendingCatches() {
  return getAll(STORES.pendingCatches);
}

export async function removePendingCatch(id) {
  await deleteOne(STORES.pendingCatches, id);
}

export async function clearPendingCatches() {
  await putAll(STORES.pendingCatches, []);
}

// --- General-purpose pending operations queue ---

/**
 * Add a pending operation to the queue.
 * @param {Object} op
 * @param {'create'|'update'|'delete'} op.type
 * @param {'catches'|'spots'} op.collection
 * @param {string|null} op.docId - Firestore doc ID (null for creates)
 * @param {Object} op.data - Payload (empty object for deletes)
 * @param {string} op.userId
 */
export async function addPendingOp(op) {
  const pendingOp = {
    id: `op_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: op.type,
    collection: op.collection,
    docId: op.docId || null,
    data: op.data || {},
    userId: op.userId,
    createdAt: new Date().toISOString(),
    retryCount: 0,
    status: 'pending',
  };
  await putOne(STORES.pendingOps, pendingOp);
  // Register background sync if available
  registerBackgroundSync();
  return pendingOp;
}

export async function getPendingOps() {
  const ops = await getAll(STORES.pendingOps);
  return ops.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getPendingOpsCount() {
  const ops = await getAll(STORES.pendingOps);
  return ops.length;
}

export async function updatePendingOp(id, updates) {
  const ops = await getAll(STORES.pendingOps);
  const op = ops.find((o) => o.id === id);
  if (!op) return;
  await putOne(STORES.pendingOps, { ...op, ...updates });
}

export async function removePendingOp(id) {
  await deleteOne(STORES.pendingOps, id);
}

/**
 * Sync all pending operations to Firebase.
 * @param {string} userId
 * @param {Object} handlers - CRUD functions keyed by operation
 * @param {Function} handlers.createCatch - (userId, data) => Promise
 * @param {Function} handlers.updateCatch - (docId, data) => Promise
 * @param {Function} handlers.deleteCatch - (docId) => Promise
 * @param {Function} handlers.createSpot - (userId, data) => Promise
 * @param {Function} handlers.updateSpot - (docId, data) => Promise
 * @param {Function} handlers.deleteSpot - (docId) => Promise
 * @param {Function} [handlers.getServerDoc] - (collection, docId) => Promise<{updatedAt}>
 * @returns {{ synced: number, failed: number }}
 */
export async function syncAllPendingOps(userId, handlers) {
  const ops = await getPendingOps();
  if (!ops.length) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const op of ops) {
    // Skip ops not belonging to this user
    if (op.userId && op.userId !== userId) continue;
    // Skip ops already being synced by another tab
    if (op.status === 'syncing') continue;

    try {
      await updatePendingOp(op.id, { status: 'syncing' });

      // Conflict resolution for updates: last-write-wins
      if (op.type === 'update' && handlers.getServerDoc) {
        try {
          const serverDoc = await handlers.getServerDoc(op.collection, op.docId);
          if (serverDoc?.updatedAt) {
            const serverTime = serverDoc.updatedAt.toDate ? serverDoc.updatedAt.toDate() : new Date(serverDoc.updatedAt);
            const clientTime = new Date(op.createdAt);
            if (serverTime > clientTime) {
              // Server version is newer — discard this update
              await removePendingOp(op.id);
              synced++;
              continue;
            }
          }
        } catch {
          // If we can't check, proceed with the update
        }
      }

      const handlerKey = `${op.type}${op.collection.charAt(0).toUpperCase()}${op.collection.slice(0, -2)}h`;
      // Map to correct handler: createCatch, updateCatch, deleteCatch, createSpot, updateSpot, deleteSpot
      const singular = op.collection === 'catches' ? 'Catch' : 'Spot';
      const handler = handlers[`${op.type}${singular}`];

      if (!handler) {
        await updatePendingOp(op.id, { status: 'failed' });
        failed++;
        continue;
      }

      if (op.type === 'create') {
        await handler(userId, op.data);
      } else if (op.type === 'update') {
        await handler(op.docId, op.data);
      } else if (op.type === 'delete') {
        await handler(op.docId);
      }

      await removePendingOp(op.id);
      synced++;
    } catch (err) {
      const newRetry = (op.retryCount || 0) + 1;
      await updatePendingOp(op.id, {
        status: newRetry >= 5 ? 'failed' : 'pending',
        retryCount: newRetry,
      });
      failed++;
    }
  }

  // Also sync legacy pending catches
  const legacyPending = await getPendingCatches();
  if (legacyPending.length && handlers.createCatch) {
    for (const item of legacyPending) {
      try {
        const { id, pendingSync, createdAt, ...data } = item;
        await handlers.createCatch(userId, data);
        await removePendingCatch(item.id);
        synced++;
      } catch {
        failed++;
      }
    }
  }

  return { synced, failed };
}

/**
 * Legacy sync function — delegates to syncAllPendingOps.
 */
export async function syncPendingCatches(userId, addCatchFn, existingCatches = []) {
  return syncAllPendingOps(userId, { createCatch: addCatchFn });
}

// --- Background sync registration ---

function registerBackgroundSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready
      .then((reg) => reg.sync.register('sync-pending-ops'))
      .catch(() => {});
  }
}
