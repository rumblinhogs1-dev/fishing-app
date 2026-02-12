import { useState, useCallback } from 'react';
import { loadCatches, saveCatches } from '../utils/storage';

export function useCatches() {
  const [catches, setCatches] = useState(() => loadCatches());

  const addCatch = useCallback((entry) => {
    const newEntry = { ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setCatches((prev) => {
      const updated = [newEntry, ...prev];
      saveCatches(updated);
      return updated;
    });
  }, []);

  const updateCatch = useCallback((id, updates) => {
    setCatches((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, ...updates } : c));
      saveCatches(updated);
      return updated;
    });
  }, []);

  const deleteCatch = useCallback((id) => {
    setCatches((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      saveCatches(updated);
      return updated;
    });
  }, []);

  const getCatch = useCallback((id) => {
    return catches.find((c) => c.id === id) || null;
  }, [catches]);

  return { catches, addCatch, updateCatch, deleteCatch, getCatch };
}
