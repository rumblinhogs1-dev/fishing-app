import { useState, useEffect } from 'react';
import { subscribeToComments } from '../utils/comments';

export function useComments(catchId) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!catchId) { setComments([]); setLoading(false); return; }
    setLoading(true);
    const unsub = subscribeToComments(catchId, (data) => {
      setComments(data);
      setLoading(false);
    });
    return unsub;
  }, [catchId]);

  return { comments, loading };
}
