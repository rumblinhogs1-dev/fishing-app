import { useState, useEffect } from 'react';
import { fetchStockingData } from '../utils/stockingData';

export function useStockingData(stateConfig) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!stateConfig) {
      setData([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchStockingData({ sheets: stateConfig.sheets, cacheKey: stateConfig.cacheKey })
      .then((entries) => {
        if (!cancelled) {
          setData(entries);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load stocking data');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [stateConfig]);

  return { data, loading, error };
}
