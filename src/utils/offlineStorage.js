/**
 * IndexedDB-backed offline storage for catches, spots, and tackle box.
 * Includes a pending queue for offline-created catches that sync when online.
 */

const DB_NAME = 'fishingAppOffline';
const DB_VERSION = 1;
const STORES = {
  catches: 'catches',
  spots: 'spots',
  tackle: 'tackle',
  pendingCatches: 'pendingCatches',
};

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      Object.values(STORES).forEach((name) => {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: 'id' });
        }
      });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
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

// --- Public API ---

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

// --- Pending catches (created offline) ---

export async function addPendingCatch(catchData) {
  const pending = {
    ...catchData,
    id: `pending_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    pendingSync: true,
    createdAt: new Date().toISOString(),
  };
  await putOne(STORES.pendingCatches, pending);
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

/**
 * Sync pending catches to Firebase.
 * Uses the provided addCatch function from firestore.js.
 * Handles conflicts by checking if a catch with same species+date already exists.
 */
export async function syncPendingCatches(userId, addCatchFn, existingCatches = []) {
  const pending = await getPendingCatches();
  if (!pending.length) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const item of pending) {
    try {
      // Basic conflict check: skip if a catch with same species, date, and weight exists
      const isDuplicate = existingCatches.some(
        (c) => c.species === item.species && c.date === item.date && c.weight === item.weight
      );

      if (!isDuplicate) {
        const { id, pendingSync, ...data } = item;
        await addCatchFn(userId, data);
      }

      await removePendingCatch(item.id);
      synced++;
    } catch (err) {
      console.error('Failed to sync catch:', err);
      failed++;
    }
  }

  return { synced, failed };
}
