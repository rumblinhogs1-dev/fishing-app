import { useState, useEffect, useCallback } from 'react';
import {
  subscribeToCatches,
  addCatch as fsAddCatch,
  updateCatch as fsUpdateCatch,
  deleteCatch as fsDeleteCatch,
} from '../utils/firestore';
import { uploadCatchImage, deleteCatchImage } from '../utils/firebaseStorage';

export function useFirestoreCatches(userId) {
  const [catches, setCatches] = useState([]);
  const [loading, setLoading] = useState(true);

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
    });
    return unsub;
  }, [userId]);

  const addCatch = useCallback(async (entry) => {
    const { image, ...data } = entry;
    const catchId = await fsAddCatch(userId, { ...data, imageUrl: '' });
    if (image && image.startsWith('data:')) {
      const imageUrl = await uploadCatchImage(userId, catchId, image);
      await fsUpdateCatch(catchId, { imageUrl });
    }
    return catchId;
  }, [userId]);

  const updateCatch = useCallback(async (id, updates) => {
    const { image, ...data } = updates;
    if (image && image.startsWith('data:')) {
      const imageUrl = await uploadCatchImage(userId, id, image);
      data.imageUrl = imageUrl;
    } else if (image === '') {
      await deleteCatchImage(userId, id);
      data.imageUrl = '';
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
