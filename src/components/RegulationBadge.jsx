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

  return (
    <div className={styles.badge} style={{ borderColor: statusColor }}>
      <span className={styles.state}>{stateName}</span>
      <span className={styles.species}>{rule.name}</span>
      <div className={styles.rules}>
        {rule.minLength && <span>Min: {rule.minLength}"</span>}
        {rule.dailyLimit && <span>Limit: {rule.dailyLimit}/day</span>}
        {rule.season && <span>{rule.season}</span>}
      </div>
      <span className={styles.disclaimer}>Verify with official sources</span>
    </div>
  );
}
