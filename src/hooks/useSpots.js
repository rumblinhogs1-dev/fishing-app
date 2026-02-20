import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  subscribeToSpots,
  addSpot as fsAddSpot,
  updateSpot as fsUpdateSpot,
  deleteSpot as fsDeleteSpot,
} from '../utils/spots';
import { cacheSpots, getCachedSpots } from '../utils/offlineStorage';

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
    return fsAddSpot(user.uid, data);
  }, [user]);

  const updateSpot = useCallback(async (spotId, updates) => {
    await fsUpdateSpot(spotId, updates);
  }, []);

  const deleteSpot = useCallback(async (spotId) => {
    await fsDeleteSpot(spotId);
  }, []);

  return { spots, loading, addSpot, updateSpot, deleteSpot };
}
