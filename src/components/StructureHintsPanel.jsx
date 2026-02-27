import { useState, useEffect } from 'react';
import { reverseGeocode } from '../utils/weather';
import { getStructureHints } from '../utils/geminiStructure';
import styles from './StructureHintsPanel.module.css';

const STRUCTURE_COLORS = {
  'drop-off': '#1565c0',
  'point': '#2e7d32',
  'hump': '#e65100',
  'creek channel': '#6a1b9a',
  'ledge': '#00695c',
  'submerged timber': '#795548',
  'rock pile': '#546e7a',
  'weed bed': '#33691e',
  'dam': '#424242',
  'bridge piling': '#bf360c',
};

function getStructureColor(type) {
  const lower = (type || '').toLowerCase();
  for (const [key, color] of Object.entries(STRUCTURE_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return '#2d6a4f';
}

export default function StructureHintsPanel({ lat, lng, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [waterBodyName, setWaterBodyName] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const name = await reverseGeocode(lat, lng).catch(() => null);
        if (cancelled) return;
        setWaterBodyName(name || '');

        const hints = await getStructureHints({ waterBodyName: name, lat, lng });
        if (cancelled) return;
        setResult(hints);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [lat, lng]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Structure & Hotspots</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        {waterBodyName && (
          <p className={styles.location}>{waterBodyName}</p>
        )}

        {loading && (
          <div className={styles.loadingWrap}>
            <span className={styles.spinner} />
            <span>Analyzing structure...</span>
          </div>
        )}

        {error && (
          <div className={styles.error}>{error}</div>
        )}

        {result && !loading && (
          <>
            <div className={styles.summary}>
              <span className={styles.tag}>{result.waterBodyType}</span>
              <span className={styles.tag}>{result.typicalDepthRange}</span>
            </div>

            <div className={styles.cards}>
              {result.structures?.map((s, i) => (
                <div
                  key={i}
                  className={styles.card}
                  style={{ borderLeftColor: getStructureColor(s.type) }}
                >
                  <div className={styles.cardHeader}>
                    <span className={styles.cardType} style={{ color: getStructureColor(s.type) }}>
                      {s.type}
                    </span>
                    {s.bestDepthRange && (
                      <span className={styles.cardDepth}>{s.bestDepthRange}</span>
                    )}
                  </div>
                  <strong className={styles.cardName}>{s.name}</strong>
                  <p className={styles.cardDesc}>{s.description}</p>
                  {s.bestSpecies?.length > 0 && (
                    <div className={styles.cardSpecies}>
                      {s.bestSpecies.map((sp, j) => (
                        <span key={j} className={styles.speciesTag}>{sp}</span>
                      ))}
                    </div>
                  )}
                  {s.fishingTip && (
                    <p className={styles.cardTip}>
                      <strong>Tip:</strong> {s.fishingTip}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
