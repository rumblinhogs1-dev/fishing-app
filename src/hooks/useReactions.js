import { useState, useEffect } from 'react';
import { subscribeToReactions } from '../utils/reactions';

export function useReactions(catchId) {
  const [reactions, setReactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!catchId) { setReactions([]); setLoading(false); return; }
    setLoading(true);
    const unsub = subscribeToReactions(catchId, (data) => {
      setReactions(data);
      setLoading(false);
    });
    return unsub;
  }, [catchId]);

  return { reactions, loading };
}
