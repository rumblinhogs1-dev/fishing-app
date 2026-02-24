import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToDepthPoints } from '../utils/depthPoints';

export function useDepthPoints() {
  const { user } = useAuth();
  const [depthPoints, setDepthPoints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setDepthPoints([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeToDepthPoints(user.uid, (data) => {
      setDepthPoints(data);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  return { depthPoints, loading };
}
