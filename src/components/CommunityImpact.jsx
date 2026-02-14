import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMonthlyPublicCatches } from '../utils/leaderboard';
import { getCommunityImpact } from '../utils/conservation';
import styles from './CommunityImpact.module.css';

export default function CommunityImpact() {
  const [impact, setImpact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const catches = await getMonthlyPublicCatches();
        if (!cancelled) {
          setImpact(getCommunityImpact(catches));
        }
      } catch (err) {
        console.error('Failed to load community impact:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading || !impact) return null;

  const { monthReleasedCount, communityReleaseRate, topConservationists } = impact;

  return (
    <div className={styles.container}>
      <button className={styles.toggle} onClick={() => setCollapsed(!collapsed)}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="#2e7d32">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
        </svg>
        <span>Community Conservation Impact</span>
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="currentColor"
          className={collapsed ? styles.chevronDown : styles.chevronUp}
        >
          <path d="M7 10l5 5 5-5z" />
        </svg>
      </button>

      {!collapsed && (
        <div className={styles.body}>
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{monthReleasedCount}</span>
              <span className={styles.statLabel}>Released This Month</span>
            </div>
            <div className={styles.statCard}>
              <div
                className={styles.rateCircle}
                style={{
                  background: `conic-gradient(#2e7d32 ${communityReleaseRate * 3.6}deg, #e0e0e0 0deg)`,
                }}
              >
                <span className={styles.rateValue}>{communityReleaseRate}%</span>
              </div>
              <span className={styles.statLabel}>Release Rate</span>
            </div>
          </div>

          {topConservationists.length > 0 && (
            <>
              <h4 className={styles.subTitle}>Top Conservationists</h4>
              <div className={styles.rankList}>
                {topConservationists.map((r) => (
                  <div key={r.userId} className={styles.rankRow}>
                    <span className={styles.rankNum}>#{r.rank}</span>
                    {r.photoURL ? (
                      <img src={r.photoURL} alt="" className={styles.avatar} referrerPolicy="no-referrer" />
                    ) : (
                      <span className={styles.avatarInitial}>
                        {(r.displayName || '?')[0].toUpperCase()}
                      </span>
                    )}
                    <div className={styles.rankInfo}>
                      <Link to={`/user/${r.userId}`} className={styles.rankName}>
                        {r.displayName}
                      </Link>
                    </div>
                    <span className={styles.rankValue}>{r.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
