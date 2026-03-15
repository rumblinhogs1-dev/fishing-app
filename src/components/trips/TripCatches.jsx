import { Link, useNavigate } from 'react-router-dom';
import styles from './TripTabs.module.css';

export default function TripCatches({ trip, catches, loading, stats }) {
  const navigate = useNavigate();

  return (
    <div className={styles.tabContent}>
      {/* Stats */}
      {stats && (
        <div className={styles.catchStatsGrid}>
          <div className={styles.catchStat}>
            <span className={styles.catchStatValue}>{stats.totalCatches}</span>
            <span className={styles.catchStatLabel}>Catches</span>
          </div>
          <div className={styles.catchStat}>
            <span className={styles.catchStatValue}>{stats.speciesCount}</span>
            <span className={styles.catchStatLabel}>Species</span>
          </div>
          {stats.biggest && (
            <div className={styles.catchStat}>
              <span className={styles.catchStatValue}>{stats.biggest.weight} lbs</span>
              <span className={styles.catchStatLabel}>Biggest</span>
            </div>
          )}
          {stats.totalWeight > 0 && (
            <div className={styles.catchStat}>
              <span className={styles.catchStatValue}>{stats.totalWeight} lbs</span>
              <span className={styles.catchStatLabel}>Total</span>
            </div>
          )}
        </div>
      )}

      {/* Catch List */}
      {!trip.date || !trip.endDate ? (
        <p className={styles.emptyText}>Add trip dates to see catches logged during this trip.</p>
      ) : loading ? (
        <p className={styles.emptyText}>Loading catches...</p>
      ) : catches ? (
        catches.length > 0 ? (
          <div className={styles.catchList}>
            {catches.map((c) => (
              <div key={c.id} className={styles.catchItem} onClick={() => navigate(`/catch/${c.id}`)}>
                {c.imageUrl ? (
                  <img src={c.imageUrl} alt="" className={styles.catchThumb} />
                ) : (
                  <span className={styles.catchThumbPlaceholder}>🐟</span>
                )}
                <div className={styles.catchItemInfo}>
                  <span className={styles.catchSpecies}>{c.species || 'Unknown'}</span>
                  <span className={styles.catchMeta}>
                    {c.weight ? `${c.weight} lbs` : ''}
                    {c.weight && c.authorDisplayName ? ' · ' : ''}
                    {c.authorDisplayName || ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.emptyText}>No catches logged during this trip.</p>
        )
      ) : null}

      <Link to="/add" className={styles.logCatchLink}>+ Log a Catch</Link>
    </div>
  );
}
