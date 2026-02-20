import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  subscribeToTackleBox,
  addTackleItem as fsAdd,
  updateTackleItem as fsUpdate,
  deleteTackleItem as fsDelete,
} from '../utils/tackleBox';
import { cacheTackle, getCachedTackle } from '../utils/offlineStorage';

export function useTackleBox() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load IndexedDB cache first for instant display
  useEffect(() => {
    if (!user) return;
    getCachedTackle().then((cached) => {
      if (cached.length) setItems(cached);
    }).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeToTackleBox(user.uid, (data) => {
      setItems(data);
      setLoading(false);
      cacheTackle(data).catch(() => {});
    });
    return unsub;
  }, [user]);

  const addItem = useCallback(async (data) => {
    return fsAdd(user.uid, data);
  }, [user]);

  const updateItem = useCallback(async (itemId, updates) => {
    await fsUpdate(itemId, updates);
  }, []);

  const deleteItem = useCallback(async (itemId) => {
    await fsDelete(itemId);
  }, []);

  return { items, loading, addItem, updateItem, deleteItem };
}
