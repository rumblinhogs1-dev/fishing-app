import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { TIERS, hasFeature } from '../config/tiers';

/**
 * Hook to read the current user's subscription tier from Firestore
 * and check feature access.
 *
 * @returns {{ tier: string, tierConfig: object, loading: boolean, canUse: (feature: string) => boolean, featureLimit: (feature: string) => number }}
 */
export function useTier() {
  const { user } = useAuth();
  const [tier, setTier] = useState('free');
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(!!user);

  useEffect(() => {
    if (!user || !db) {
      setTier('free');
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        const data = snap.data();
        const userTier = data?.tier || 'free';
        setTier(TIERS[userTier] ? userTier : 'free');
        setUsage(data?.usage || null);
        setLoading(false);
      },
      () => {
        // On error, default to free
        setTier('free');
        setLoading(false);
      }
    );

    return unsub;
  }, [user]);

  function canUse(featureName) {
    return hasFeature(tier, featureName);
  }

  function featureLimit(featureName) {
    const config = TIERS[tier] || TIERS.free;
    const value = config.features[featureName];
    return typeof value === 'number' ? value : 0;
  }

  return {
    tier,
    tierConfig: TIERS[tier] || TIERS.free,
    usage,
    loading,
    canUse,
    featureLimit,
  };
}
