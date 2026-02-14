import { useState, useEffect } from 'react';
import { subscribeToChallenges } from '../utils/challenges';
import { useAuth } from '../contexts/AuthContext';

export function useChallenges() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setChallenges([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = subscribeToChallenges(user.uid, (data) => {
      setChallenges(data);
      setLoading(false);
    });

    return unsub;
  }, [user]);

  return { challenges, loading };
}
