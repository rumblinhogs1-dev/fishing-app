import { useState, useEffect, useCallback } from 'react';
import {
  subscribeToCatches,
  addCatch as fsAddCatch,
  updateCatch as fsUpdateCatch,
  deleteCatch as fsDeleteCatch,
} from '../utils/firestore';
import { uploadCatchImage, deleteCatchImage } from '../utils/firebaseStorage';
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

  // One-time backfill: set visibility to public and add author info on old catches
  useEffect(() => {
    if (!userId || !catches.length || loading) return;
    const migrateKey = `catches-backfill-v2-${userId}`;
    if (sessionStorage.getItem(migrateKey)) return;
    sessionStorage.setItem(migrateKey, '1');

    const toUpdate = catches.filter(
      (c) => c.visibility !== 'public' || !c.authorDisplayName
    );
    if (!toUpdate.length) return;

    const displayName = user?.displayName || 'Angler';
    const photoURL = user?.photoURL || null;
    toUpdate.forEach((c) => {
      const patch = {};
      if (c.visibility !== 'public') patch.visibility = 'public';
      if (!c.authorDisplayName) patch.authorDisplayName = displayName;
      if (!c.authorPhotoURL && photoURL) patch.authorPhotoURL = photoURL;
      if (Object.keys(patch).length) {
        fsUpdateCatch(c.id, patch).catch((err) =>
          console.error('Backfill failed for', c.id, err)
        );
      }
    });
  }, [userId, catches, loading, user]);

  const addCatch = useCallback(async (entry) => {
    const { image, lureImage, ...data } = entry;
    data.authorDisplayName = user?.displayName || 'Angler';
    data.authorPhotoURL = user?.photoURL || null;

    // Upload image BEFORE creating the doc so imageUrl is set from the start
    if (image && image.startsWith('data:')) {
      // Need a temp ID for the storage path — create doc first with placeholder
      const catchId = await fsAddCatch(userId, { ...data, imageUrl: '', lureImage: '' });
      try {
        const imageUrl = await uploadCatchImage(userId, catchId, image);
        if (imageUrl) await fsUpdateCatch(catchId, { imageUrl });
      } catch (err) {
        console.error('Image upload failed:', err);
      }
      if (lureImage && lureImage.startsWith('data:')) {
        try {
          const lureImageUrl = await uploadCatchImage(userId, `${catchId}/lure`, lureImage);
          if (lureImageUrl) await fsUpdateCatch(catchId, { lureImage: lureImageUrl });
        } catch (err) {
          console.error('Lure image upload failed:', err);
        }
      }
      notifyFriendCatch(userId, user?.displayName, catchId, data.species).catch(() => {});
      return catchId;
    }

    // No image — just create the doc
    if (lureImage && lureImage.startsWith('data:')) {
      data.lureImage = '';
    }
    const catchId = await fsAddCatch(userId, { ...data, imageUrl: '' });
    if (lureImage && lureImage.startsWith('data:')) {
      uploadCatchImage(userId, `${catchId}/lure`, lureImage)
        .then((lureImageUrl) => fsUpdateCatch(catchId, { lureImage: lureImageUrl }))
        .catch((err) => console.error('Lure image upload failed:', err));
    }
    notifyFriendCatch(userId, user?.displayName, catchId, data.species).catch(() => {});
    return catchId;
  }, [userId, user]);

  const updateCatch = useCallback(async (id, updates) => {
    const { image, lureImage, ...data } = updates;
    if (image && image.startsWith('data:')) {
      const imageUrl = await uploadCatchImage(userId, id, image);
      data.imageUrl = imageUrl;
    } else if (image === '') {
      await deleteCatchImage(userId, id);
      data.imageUrl = '';
    }
    if (lureImage && lureImage.startsWith('data:')) {
      const lureImageUrl = await uploadCatchImage(userId, `${id}/lure`, lureImage);
      data.lureImage = lureImageUrl;
    }
    await fsUpdateCatch(id, data);
  }, [userId]);

  const deleteCatch = useCallback(async (id) => {
    await deleteCatchImage(userId, id).catch(() => {});
    await fsDeleteCatch(id);
  }, [userId]);

  const getCatch = useCallback((id) => {
    return catches.find((c) => c.id === id) || null;
  }, [catches]);

  return { catches, loading, addCatch, updateCatch, deleteCatch, getCatch };
}
