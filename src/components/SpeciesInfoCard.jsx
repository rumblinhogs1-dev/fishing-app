import { useState, useEffect } from 'react';
import { getSpeciesInfo } from '../utils/geminiSpeciesInfo';
import { getApiKey } from '../utils/gemini';
import styles from './SpeciesInfoCard.module.css';

export default function SpeciesInfoCard({ speciesName }) {
  const [expanded, setExpanded] = useState(false);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pre-fetch on mount so expansion is instant when cached
  useEffect(() => {
    if (!speciesName) return;
    const apiKey = getApiKey();
    if (!apiKey) return;

    let cancelled = false;
    setLoading(true);
    setError('');
    setInfo(null);

    getSpeciesInfo(speciesName, apiKey)
      .then((data) => {
        if (!cancelled) setInfo(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [speciesName]);

  if (!speciesName) return null;

  return (
    <div className={styles.card}>
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setExpanded((v) => !v)}
      >
        <span className={styles.toggleIcon}>{expanded ? '\u25BC' : '\u25B6'}</span>
        View species info
      </button>

      {expanded && (
        <div className={styles.content}>
          {loading && (
            <div className={styles.loading}>
              <span className={styles.spinner} />
              Loading species info...
            </div>
          )}
          {error && <div className={styles.error}>{error}</div>}
          {info && !loading && (
            <div className={styles.grid}>
              {info.commonName && (
                <div className={styles.item}>
                  <span className={styles.label}>Common Name</span>
                  <span className={styles.value}>{info.commonName}</span>
                </div>
              )}
              {info.scientificName && (
                <div className={styles.item}>
                  <span className={styles.label}>Scientific Name</span>
                  <span className={`${styles.value} ${styles.italic}`}>{info.scientificName}</span>
                </div>
              )}
              {info.sizeRange && (
                <div className={styles.item}>
                  <span className={styles.label}>Typical Size</span>
                  <span className={styles.value}>{info.sizeRange}</span>
                </div>
              )}
              {info.weightRange && (
                <div className={styles.item}>
                  <span className={styles.label}>Typical Weight</span>
                  <span className={styles.value}>{info.weightRange}</span>
                </div>
              )}
              {info.habitat && (
                <div className={styles.item + ' ' + styles.full}>
                  <span className={styles.label}>Habitat</span>
                  <span className={styles.value}>{info.habitat}</span>
                </div>
              )}
              {info.peakSeason && (
                <div className={styles.item}>
                  <span className={styles.label}>Peak Season</span>
                  <span className={styles.value}>{info.peakSeason}</span>
                </div>
              )}
              {info.stateRecord && (
                <div className={styles.item}>
                  <span className={styles.label}>Record / Trophy</span>
                  <span className={styles.value}>{info.stateRecord}</span>
                </div>
              )}
              {info.funFact && (
                <div className={styles.item + ' ' + styles.full}>
                  <span className={styles.label}>Fun Fact</span>
                  <span className={styles.value}>{info.funFact}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
