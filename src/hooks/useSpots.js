import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  subscribeToSpots,
  addSpot as fsAddSpot,
  updateSpot as fsUpdateSpot,
  deleteSpot as fsDeleteSpot,
} from '../utils/spots';
import { cacheSpots, getCachedSpots, addPendingOp } from '../utils/offlineStorage';

export function useSpots() {
  const { user } = useAuth();
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load IndexedDB cache first for instant display
  useEffect(() => {
    if (!user) return;
    getCachedSpots().then((cached) => {
      if (cached.length) setSpots(cached);
    }).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) {
      setSpots([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeToSpots(user.uid, (data) => {
      setSpots(data);
      setLoading(false);
      cacheSpots(data).catch(() => {});
    });
    return unsub;
  }, [user]);

  const addSpot = useCallback(async (data) => {
    if (!navigator.onLine) {
      const tempId = `pending_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const pendingSpot = { ...data, id: tempId, _pendingSync: true };
      setSpots((prev) => [pendingSpot, ...prev]);
      await addPendingOp({
        type: 'create',
        collection: 'spots',
        docId: null,
        data,
        userId: user.uid,
      });
      return tempId;
    }
    return fsAddSpot(user.uid, data);
  }, [user]);

  const updateSpot = useCallback(async (spotId, updates) => {
    if (!navigator.onLine) {
      setSpots((prev) => prev.map((s) => s.id === spotId ? { ...s, ...updates, _pendingSync: true } : s));
      getCachedSpots().then((cached) => {
        cacheSpots(cached.map((s) => s.id === spotId ? { ...s, ...updates } : s));
      }).catch(() => {});
      await addPendingOp({
        type: 'update',
        collection: 'spots',
        docId: spotId,
        data: updates,
        userId: user.uid,
      });
      return;
    }
    await fsUpdateSpot(spotId, updates);
  }, [user]);

  const deleteSpot = useCallback(async (spotId) => {
    if (!navigator.onLine) {
      setSpots((prev) => prev.filter((s) => s.id !== spotId));
      getCachedSpots().then((cached) => {
        cacheSpots(cached.filter((s) => s.id !== spotId));
      }).catch(() => {});
      await addPendingOp({
        type: 'delete',
        collection: 'spots',
        docId: spotId,
        data: {},
        userId: user.uid,
      });
      return;
    }
    await fsDeleteSpot(spotId);
  }, [user]);

  return { spots, loading, addSpot, updateSpot, deleteSpot };
}
