import { useState, useEffect, useCallback } from 'react';
import {
  subscribeToCatches,
  addCatch as fsAddCatch,
  updateCatch as fsUpdateCatch,
  deleteCatch as fsDeleteCatch,
} from '../utils/firestore';
import { uploadCatchImage } from '../utils/firebaseStorage';
import { notifyFriendCatch } from '../utils/notifications';
import { cacheCatches, getCachedCatches, addPendingOp, getPendingOpsCount } from '../utils/offlineStorage';
import { trackCatchLogged } from '../utils/usageTracking';
import { trackContributionPoints } from '../utils/contributionPoints';

export function useFirestoreCatches(user) {
  const userId = user?.uid;
  const [catches, setCatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  // Load IndexedDB cache first for instant display
  useEffect(() => {
    if (!userId) return;
    getCachedCatches().then((cached) => {
      if (cached.length) setCatches(cached);
    }).catch(() => {});
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setCatches([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeToCatches(userId, (data) => {
      setCatches(data);
      setLoading(false);
      cacheCatches(data).catch(() => {});
    });
    return unsub;
  }, [userId]);

  // Track pending ops count
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const check = () => {
      getPendingOpsCount().then((count) => {
        if (!cancelled) setPendingCount(count);
      }).catch(() => {});
    };
    check();
    const interval = setInterval(check, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [userId]);

  // One-time repair: fix catches with missing imageUrl from DataMigration or offline sync
  useEffect(() => {
    if (!userId || !catches.length || loading) return;
    const repairKey = `catches-image-repair-v1-${userId}`;
    if (localStorage.getItem(repairKey)) return;

    const needsRepair = catches.filter((c) => !c.imageUrl);
    if (!needsRepair.length) {
      localStorage.setItem(repairKey, '1');
      return;
    }

    // Mark as attempted so it only runs once
    localStorage.setItem(repairKey, '1');

    let cancelled = false;
    (async () => {
      for (const c of needsRepair) {
        if (cancelled) return;
        try {
          // Case 1: image field exists (from offline sync storing image instead of imageUrl)
          if (c.image && typeof c.image === 'string' && c.image.startsWith('data:')) {
            if (cancelled) return;
            await fsUpdateCatch(c.id, { imageUrl: c.image });
            continue;
          }

          // Case 2: try to recover from Firebase Storage (DataMigration uploaded but failed to update doc)
          const { getDownloadURL, ref } = await import('firebase/storage');
          const { storage } = await import('../firebase');
          const storageRef = ref(storage, `users/${userId}/catches/${c.id}/photo.jpg`);
          const url = await getDownloadURL(storageRef);
          if (cancelled) return;
          await fsUpdateCatch(c.id, { imageUrl: url });
        } catch {
          // No image source found — nothing to recover
        }
      }
    })();

    return () => { cancelled = true; };
  }, [userId, catches, loading]);

  const addCatch = useCallback(async (entry) => {
    const { image, lureImage, ...data } = entry;
    data.authorDisplayName = user?.displayName || 'Angler';
    data.authorPhotoURL = user?.photoURL || null;

    // Offline: queue the operation
    if (!navigator.onLine) {
      await addPendingOp({
        type: 'create',
        collection: 'catches',
        docId: null,
        data: { image, lureImage, ...data },
        userId,
      });
      // Optimistic local update
      const tempId = `pending_${Date.now()}`;
      const tempCatch = { ...data, id: tempId, imageUrl: image || '', _pendingSync: true, createdAt: new Date().toISOString() };
      setCatches((prev) => [tempCatch, ...prev]);
      return tempId;
    }

    // Create doc first, then upload images to Storage
    const catchId = await fsAddCatch(userId, data);
    trackCatchLogged(userId).catch(() => {});
    trackContributionPoints(userId).catch(() => {});

    try {
      const updates = {};
      if (image && image.startsWith('data:')) {
        const url = await uploadCatchImage(userId, catchId, image);
        if (url) updates.imageUrl = url;
      }
      if (lureImage && lureImage.startsWith('data:')) {
        const lureRef = (await import('firebase/storage')).ref;
        const { storage } = await import('../firebase');
        const { uploadString, getDownloadURL } = await import('firebase/storage');
        const storageRef = lureRef(storage, `users/${userId}/catches/${catchId}/lure.jpg`);
        const snap = await uploadString(storageRef, lureImage, 'data_url');
        updates.lureImage = await getDownloadURL(snap.ref);
      }
      if (Object.keys(updates).length) {
        await fsUpdateCatch(catchId, updates);
      }
    } catch (err) {
    }

    notifyFriendCatch(userId, user?.displayName, catchId, data.species).catch(() => {});
    return catchId;
  }, [userId, user]);

  const updateCatch = useCallback(async (id, updates) => {
    const { image, lureImage, ...data } = updates;

    // Offline: queue the update with optimistic local change
    if (!navigator.onLine) {
      setCatches((prev) => prev.map((c) => c.id === id ? { ...c, ...data, _pendingSync: true } : c));
      // Update IndexedDB cache
      getCachedCatches().then((cached) => {
        cacheCatches(cached.map((c) => c.id === id ? { ...c, ...data } : c));
      }).catch(() => {});
      await addPendingOp({
        type: 'update',
        collection: 'catches',
        docId: id,
        data: { image, lureImage, ...data },
        userId,
      });
      return;
    }

    if (image && image.startsWith('data:')) {
      try {
        const url = await uploadCatchImage(userId, id, image);
        if (url) data.imageUrl = url;
      } catch (err) {
      }
    } else if (image === '') {
      data.imageUrl = '';
    }
    if (lureImage && lureImage.startsWith('data:')) {
      try {
        const lureRef = (await import('firebase/storage')).ref;
        const { storage } = await import('../firebase');
        const { uploadString, getDownloadURL } = await import('firebase/storage');
        const storageRef = lureRef(storage, `users/${userId}/catches/${id}/lure.jpg`);
        const snap = await uploadString(storageRef, lureImage, 'data_url');
        data.lureImage = await getDownloadURL(snap.ref);
      } catch (err) {
      }
    }

    await fsUpdateCatch(id, data);
  }, [userId]);

  const deleteCatch = useCallback(async (id) => {
    // Offline: queue the delete with optimistic local removal
    if (!navigator.onLine) {
      setCatches((prev) => prev.filter((c) => c.id !== id));
      getCachedCatches().then((cached) => {
        cacheCatches(cached.filter((c) => c.id !== id));
      }).catch(() => {});
      await addPendingOp({
        type: 'delete',
        collection: 'catches',
        docId: id,
        data: {},
        userId,
      });
      return;
    }

    await fsDeleteCatch(id);
  }, [userId]);

  const getCatch = useCallback((id) => {
    return catches.find((c) => c.id === id) || null;
  }, [catches]);

  return { catches, loading, addCatch, updateCatch, deleteCatch, getCatch, pendingCount };
}
