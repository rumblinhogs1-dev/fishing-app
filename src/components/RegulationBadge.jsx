import { useState, useEffect } from 'react';
import { detectStateFromGPS, lookupByState, lookupBySpecies } from '../utils/regulations';
import styles from './RegulationBadge.module.css';

export default function RegulationBadge({ lat, lng, species }) {
  const [rule, setRule] = useState(null);
  const [stateName, setStateName] = useState('');

  useEffect(() => {
    if (!lat || !lng) return;
    let cancelled = false;

    async function detect() {
      const stateCode = await detectStateFromGPS(lat, lng);
      if (cancelled || !stateCode) return;

      const stateData = lookupByState(stateCode);
      if (!stateData) return;
      setStateName(stateData.state);

      if (species) {
        const speciesRule = lookupBySpecies(stateCode, species);
        if (!cancelled && speciesRule) setRule(speciesRule);
      }
    }
    detect();
    return () => { cancelled = true; };
  }, [lat, lng, species]);

  if (!rule) return null;

  const statusColor = rule.status === 'open' ? '#4caf50' : rule.status === 'closed' ? '#d32f2f' : '#ff9800';
  const isKeepable = rule.status === 'open' && rule.dailyLimit > 0;

  return (
    <div className={styles.badge} style={{ borderColor: statusColor }}>
      <div className={styles.keepBanner} style={{ background: statusColor }}>
        {isKeepable ? 'Keep or Release?' : rule.status === 'closed' ? 'Season Closed' : 'Check Regulations'}
      </div>
      <span className={styles.state}>{stateName}</span>
      <span className={styles.species}>{rule.name}</span>
      <div className={styles.quickRules}>
        {rule.dailyLimit && (
          <span className={styles.quickRule}>
            <strong>{rule.dailyLimit}</strong> per day
          </span>
        )}
        {rule.minLength && (
          <span className={styles.quickRule}>
            Min <strong>{rule.minLength}"</strong>
          </span>
        )}
        {rule.maxLength && (
          <span className={styles.quickRule}>
            Max <strong>{rule.maxLength}"</strong>
          </span>
        )}
        {rule.season && (
          <span className={styles.quickRule}>{rule.season}</span>
        )}
      </div>
      <span className={styles.disclaimer}>Verify with official sources before keeping fish</span>
    </div>
  );
}
