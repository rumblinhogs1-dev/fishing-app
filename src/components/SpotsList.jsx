import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSpots } from '../hooks/useSpots';
import { useCatchesProvider } from '../hooks/useCatchesProvider';
import { useConfirm } from '../contexts/ConfirmContext';
import styles from './SpotsList.module.css';

const PROXIMITY = 0.01; // ~1.1 km

function computeStats(spot, catches) {
  const nearby = catches.filter(
    (c) =>
      c.lat && c.lng &&
      Math.abs(c.lat - spot.lat) < PROXIMITY &&
      Math.abs(c.lng - spot.lng) < PROXIMITY
  );

  const weights = nearby.filter((c) => c.weight).map((c) => parseFloat(c.weight));
  const avgWeight = weights.length > 0
    ? (weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1)
    : null;

  const dates = nearby.filter((c) => c.date).map((c) => new Date(c.date));
  const lastVisited = dates.length > 0
    ? new Date(Math.max(...dates)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return { catchCount: nearby.length, avgWeight, lastVisited };
}

export default function SpotsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { spots, loading, deleteSpot } = useSpots();
  const { catches } = useCatchesProvider();
  const confirm = useConfirm();
  const [deleting, setDeleting] = useState(null);

  const spotsWithStats = useMemo(
    () => spots.map((spot) => ({ ...spot, ...computeStats(spot, catches) })),
    [spots, catches]
  );

  async function handleDelete(spotId) {
    if (!await confirm('Delete this spot? This cannot be undone.', { destructive: true })) return;
    setDeleting(spotId);
    try {
      await deleteSpot(spotId);
    } catch (err) {
      console.error('Failed to delete spot:', err);
    }
    setDeleting(null);
  }

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.signIn}>
          <h2>My Fishing Spots</h2>
          <p>Sign in to save and manage your favorite fishing spots.</p>
          <Link to="/auth" className={styles.signInBtn}>Sign In</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return <p className={styles.loading}>Loading spots...</p>;
  }

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={() => navigate(-1)}>&larr; Back</button>
      <div className={styles.header}>
        <h2 className={styles.title}>My Fishing Spots</h2>
        <Link to="/map" className={styles.mapLink}>View Map</Link>
      </div>

      {spotsWithStats.length === 0 ? (
        <div className={styles.empty}>
          <p>No saved spots yet.</p>
          <p className={styles.emptyHint}>
            Save spots from the <Link to="/map">Map</Link> or from any catch with GPS coordinates.
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {spotsWithStats.map((spot) => (
            <div key={spot.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#d4a017">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <div className={styles.cardInfo}>
                  <h3 className={styles.cardName}>{spot.name}</h3>
                  <span className={styles.cardCoords}>
                    {spot.lat.toFixed(4)}, {spot.lng.toFixed(4)}
                  </span>
                </div>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(spot.id)}
                  disabled={deleting === spot.id}
                  title="Delete spot"
                >
                  {deleting === spot.id ? '...' : '\u00D7'}
                </button>
              </div>

              {spot.notes && <p className={styles.notes}>{spot.notes}</p>}

              <div className={styles.stats}>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{spot.catchCount}</span>
                  <span className={styles.statLabel}>Catches</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{spot.avgWeight ? `${spot.avgWeight} lbs` : '—'}</span>
                  <span className={styles.statLabel}>Avg Weight</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{spot.lastVisited || '—'}</span>
                  <span className={styles.statLabel}>Last Visited</span>
                </div>
              </div>

              <Link to="/map" className={styles.viewMapBtn}>View on Map</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
