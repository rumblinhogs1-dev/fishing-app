import { useState, useCallback } from 'react';

const STORAGE_KEY = 'fishing-app-map-layers';

const DEFAULTS = {
  basemap: 'osm',
  depthContours: false,
  openSeaBathy: false,
  navionics: false,
  catchPins: true,
  heatmap: false,
  favoriteSpots: true,
  usgsGauges: false,
  noaaCharts: false,
  usgsTopo: false,
  publicLands: false,
  sonarData: false,
  stockingSchedule: false,
};

function loadLayers() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...DEFAULTS, ...JSON.parse(saved) };
  } catch { /* ignore */ }
  return { ...DEFAULTS };
}

export function useMapLayers() {
  const [layers, setLayers] = useState(loadLayers);

  const persist = useCallback((next) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }, []);

  const toggleLayer = useCallback((key) => {
    setLayers((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      persist(next);
      return next;
    });
  }, [persist]);

  const setBasemap = useCallback((name) => {
    setLayers((prev) => {
      const next = { ...prev, basemap: name };
      persist(next);
      return next;
    });
  }, [persist]);

  return { layers, toggleLayer, setBasemap };
}
