import { useMemo, useState } from 'react';
import { computePatterns } from '../../utils/insightsCompute';
import styles from '../Insights.module.css';

const VAR_COLORS = {
  species: '#2d6a4f',
  lure: '#ff9800',
  season: '#e91e63',
  timeSlot: '#9c27b0',
  weather: '#00bcd4',
  moon: '#607d8b',
};

const VAR_LABELS = {
  species: 'Species',
  lure: 'Lure/Bait',
  season: 'Season',
  timeSlot: 'Time',
  weather: 'Weather',
  moon: 'Moon Phase',
};

export default function PatternsTab({ catches }) {
  const patterns = useMemo(() => computePatterns(catches), [catches]);
  const [filterSpecies, setFilterSpecies] = useState('');

  const species = useMemo(() => {
    const set = new Set();
    catches.forEach((c) => {
      if (c.species) set.add(c.species.trim().toLowerCase());
    });
    return [...set].sort();
  }, [catches]);

  const filtered = filterSpecies
    ? patterns.filter((p) => p.values.species === filterSpecies)
    : patterns;

  const pairs = filtered.filter((p) => p.variables.length === 2);
  const triples = filtered.filter((p) => p.variables.length === 3);

  if (catches.length < 10) {
    return (
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Patterns</h3>
        <p className={styles.empty}>
          Need at least 10 catches to detect patterns. Keep logging!
        </p>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Patterns</h3>
      <p className={styles.coachIntro}>
        Cross-variable correlations detected in your catch data. Higher multipliers mean stronger patterns.
      </p>

      {species.length > 1 && (
        <select
          className={styles.speciesSelect}
          value={filterSpecies}
          onChange={(e) => setFilterSpecies(e.target.value)}
        >
          <option value="">All species</option>
          {species.map((sp) => (
            <option key={sp} value={sp}>{sp}</option>
          ))}
        </select>
      )}

      {filtered.length === 0 ? (
        <p className={styles.empty}>No strong patterns detected yet. More data will reveal trends.</p>
      ) : (
        <>
          {pairs.length > 0 && (
            <>
              <h4 className={styles.subHeading}>Two-Factor Patterns</h4>
              <div className={styles.patternsGrid}>
                {pairs.map((p, i) => (
                  <PatternCard key={i} pattern={p} />
                ))}
              </div>
            </>
          )}

          {triples.length > 0 && (
            <>
              <h4 className={styles.subHeading}>Three-Factor Patterns</h4>
              <div className={styles.patternsGrid}>
                {triples.map((p, i) => (
                  <PatternCard key={i} pattern={p} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function PatternCard({ pattern }) {
  return (
    <div className={styles.patternCard}>
      <div className={styles.patternTags}>
        {pattern.variables.map((v) => (
          <span key={v} className={styles.patternTag} style={{ background: VAR_COLORS[v] || '#888' }}>
            {VAR_LABELS[v] || v}: {pattern.values[v]}
          </span>
        ))}
      </div>
      <p className={styles.patternInsight}>{pattern.insight}</p>
      <div className={styles.patternMeta}>
        <span>{pattern.count} catches ({pattern.percentage}%)</span>
        {pattern.multiplier >= 1.5 && (
          <span className={styles.patternMultiplier}>{pattern.multiplier}x</span>
        )}
      </div>
    </div>
  );
}
