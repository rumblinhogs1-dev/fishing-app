import { useMemo } from 'react';
import styles from './Stats.module.css';

export default function Stats({ catches }) {
  const stats = useMemo(() => {
    if (catches.length === 0) return null;

    const total = catches.length;

    const withWeight = catches.filter((c) => c.weight);
    const biggest = withWeight.length
      ? withWeight.reduce((max, c) => (c.weight > max.weight ? c : max))
      : null;

    const speciesCount = {};
    catches.forEach((c) => {
      if (c.species) {
        const s = c.species.trim().toLowerCase();
        speciesCount[s] = (speciesCount[s] || 0) + 1;
      }
    });
    const topSpecies = Object.entries(speciesCount).sort((a, b) => b[1] - a[1]);

    const monthCount = {};
    catches.forEach((c) => {
      if (c.date) {
        const key = c.date.slice(0, 7); // YYYY-MM
        monthCount[key] = (monthCount[key] || 0) + 1;
      }
    });
    const months = Object.entries(monthCount).sort((a, b) => a[0].localeCompare(b[0]));

    const locationCount = {};
    catches.forEach((c) => {
      if (c.location) {
        const l = c.location.trim().toLowerCase();
        locationCount[l] = (locationCount[l] || 0) + 1;
      }
    });
    const topLocations = Object.entries(locationCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return { total, biggest, topSpecies, months, topLocations };
  }, [catches]);

  if (!stats) {
    return (
      <div className={styles.container}>
        <h2 className={styles.heading}>Statistics</h2>
        <p className={styles.empty}>No data yet. Start logging catches to see your stats!</p>
      </div>
    );
  }

  const maxMonth = stats.months.length ? Math.max(...stats.months.map((m) => m[1])) : 0;

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Statistics</h2>

      <div className={styles.cards}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.total}</span>
          <span className={styles.statLabel}>Total Catches</span>
        </div>

        {stats.biggest && (
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.biggest.weight} lbs</span>
            <span className={styles.statLabel}>Biggest — {stats.biggest.species}</span>
          </div>
        )}

        {stats.topSpecies.length > 0 && (
          <div className={styles.statCard}>
            <span className={styles.statValue} style={{ textTransform: 'capitalize' }}>
              {stats.topSpecies[0][0]}
            </span>
            <span className={styles.statLabel}>Most Common ({stats.topSpecies[0][1]})</span>
          </div>
        )}
      </div>

      {stats.topSpecies.length > 0 && (
        <section className={styles.section}>
          <h3>Species Breakdown</h3>
          <ul className={styles.list}>
            {stats.topSpecies.map(([species, count]) => (
              <li key={species} className={styles.listItem}>
                <span style={{ textTransform: 'capitalize' }}>{species}</span>
                <span className={styles.count}>{count}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {stats.topLocations.length > 0 && (
        <section className={styles.section}>
          <h3>Top Locations</h3>
          <ul className={styles.list}>
            {stats.topLocations.map(([loc, count]) => (
              <li key={loc} className={styles.listItem}>
                <span style={{ textTransform: 'capitalize' }}>{loc}</span>
                <span className={styles.count}>{count}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {stats.months.length > 0 && (
        <section className={styles.section}>
          <h3>Catches Over Time</h3>
          <div className={styles.chart}>
            {stats.months.map(([month, count]) => (
              <div key={month} className={styles.bar}>
                <div
                  className={styles.barFill}
                  style={{ height: `${(count / maxMonth) * 100}%` }}
                />
                <span className={styles.barLabel}>{month.slice(5)}</span>
                <span className={styles.barValue}>{count}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
