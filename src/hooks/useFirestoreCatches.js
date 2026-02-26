import { useState, useEffect, useCallback } from 'react';
import {
  subscribeToCatches,
  addCatch as fsAddCatch,
  updateCatch as fsUpdateCatch,
  deleteCatch as fsDeleteCatch,
} from '../utils/firestore';
import { notifyFriendCatch } from '../utils/notifications';
import { cacheCatches, getCachedCatches } from '../utils/offlineStorage';

export function useFirestoreCatches(user) {
  const userId = user?.uid;
  const [catches, setCatches] = useState([]);
  const [loading, setLoading] = useState(true);

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
    console.log(`Image repair: found ${needsRepair.length} catches with missing imageUrl`);

    needsRepair.forEach(async (c) => {
      try {
        // Case 1: image field exists (from offline sync storing image instead of imageUrl)
        if (c.image && typeof c.image === 'string' && c.image.startsWith('data:')) {
          await fsUpdateCatch(c.id, { imageUrl: c.image });
          console.log('Image repair: copied image→imageUrl for catch', c.id);
          return;
        }

        // Case 2: try to recover from Firebase Storage (DataMigration uploaded but failed to update doc)
        const { getDownloadURL, ref } = await import('firebase/storage');
        const { storage } = await import('../firebase');
        const storageRef = ref(storage, `users/${userId}/catches/${c.id}/photo.jpg`);
        const url = await getDownloadURL(storageRef);
        await fsUpdateCatch(c.id, { imageUrl: url });
        console.log('Image repair: recovered Storage URL for catch', c.id);
      } catch {
        // No image source found — nothing to recover
      }
    });
  }, [userId, catches, loading]);

  const addCatch = useCallback(async (entry) => {
    const { image, lureImage, ...data } = entry;
    data.authorDisplayName = user?.displayName || 'Angler';
    data.authorPhotoURL = user?.photoURL || null;

    // Store image data URL directly in Firestore (already compressed by ImageUpload)
    if (image && image.startsWith('data:')) {
      data.imageUrl = image;
    }
    if (lureImage && lureImage.startsWith('data:')) {
      data.lureImage = lureImage;
    }

    const catchId = await fsAddCatch(userId, data);
    notifyFriendCatch(userId, user?.displayName, catchId, data.species).catch(() => {});
    return catchId;
  }, [userId, user]);

  const updateCatch = useCallback(async (id, updates) => {
    const { image, lureImage, ...data } = updates;
    if (image && image.startsWith('data:')) {
      data.imageUrl = image;
    } else if (image === '') {
      data.imageUrl = '';
    }
    if (lureImage && lureImage.startsWith('data:')) {
      data.lureImage = lureImage;
    }
    await fsUpdateCatch(id, data);
  }, []);

  const deleteCatch = useCallback(async (id) => {
    await fsDeleteCatch(id);
  }, []);

  const getCatch = useCallback((id) => {
    return catches.find((c) => c.id === id) || null;
  }, [catches]);

  return { catches, loading, addCatch, updateCatch, deleteCatch, getCatch };
}
