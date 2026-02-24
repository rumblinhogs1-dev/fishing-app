import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  doc,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';

const COL = 'depthPoints';
const BATCH_SIZE = 500;

/**
 * Subscribe to a user's depth points (real-time).
 * Returns an unsubscribe function.
 */
export function subscribeToDepthPoints(userId, callback) {
  const q = query(
    collection(db, COL),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const points = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(points);
  });
}

/**
 * Batch-write an array of parsed depth points to Firestore.
 * Calls onProgress(written, total) after each batch.
 * Returns the importBatch UUID.
 */
export async function saveDepthPoints(userId, points, importBatch, onProgress) {
  let written = 0;

  for (let i = 0; i < points.length; i += BATCH_SIZE) {
    const chunk = points.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);

    for (const p of chunk) {
      const ref = doc(collection(db, COL));
      batch.set(ref, {
        userId,
        lat: p.lat,
        lng: p.lng,
        depth: p.depth,
        waterTemp: p.waterTemp ?? null,
        timestamp: p.timestamp ?? null,
        source: p.source,
        importBatch,
        createdAt: serverTimestamp(),
      });
    }

    await batch.commit();
    written += chunk.length;
    onProgress?.(written, points.length);
  }

  return importBatch;
}

/**
 * Delete all depth points for a given import batch.
 */
export async function deleteImportBatch(userId, importBatch) {
  const q = query(
    collection(db, COL),
    where('userId', '==', userId),
    where('importBatch', '==', importBatch)
  );
  const snap = await getDocs(q);

  for (let i = 0; i < snap.docs.length; i += BATCH_SIZE) {
    const chunk = snap.docs.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    chunk.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}
