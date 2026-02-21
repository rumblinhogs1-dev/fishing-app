import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFriends } from '../hooks/useFriends';
import {
  getMonthlyPublicCatches,
  getAllPublicCatches,
  getMonthlyFriendsCatches,
  getAllFriendsCatches,
  getMonthlyRegionCatches,
  getAllRegionCatches,
  rankBiggestCatch,
  rankMostCatches,
  rankMostSpecies,
  rankLongestFish,
} from '../utils/leaderboard';
import { SkeletonList } from './Skeleton';
import styles from './Leaderboard.module.css';

const CATEGORIES = [
  { key: 'biggest', label: 'Biggest Catch', period: 'month', rankFn: rankBiggestCatch },
  { key: 'most', label: 'Most Catches', period: 'month', rankFn: rankMostCatches },
  { key: 'species', label: 'Most Species', period: 'all', rankFn: rankMostSpecies },
  { key: 'longest', label: 'Longest Fish', period: 'month', rankFn: rankLongestFish },
];

const MEDALS = ['', '\u{1F947}', '\u{1F948}', '\u{1F949}'];

export default function Leaderboard() {
  const { user } = useAuth();
  const { userProfile } = useFriends();
  const [scope, setScope] = useState('all');
  const [category, setCategory] = useState('biggest');
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const cat = CATEGORIES.find((c) => c.key === category);
        let catches;

        if (scope === 'local') {
          const region = userProfile?.region;
          if (!region) { if (!cancelled) { setRankings([]); setLoading(false); } return; }
          catches = cat.period === 'month'
            ? await getMonthlyRegionCatches(region)
            : await getAllRegionCatches(region);
        } else if (scope === 'friends') {
          const ids = userProfile?.friendIds?.length
            ? [user?.uid, ...userProfile.friendIds].slice(0, 30)
            : user ? [user.uid] : [];
          catches = cat.period === 'month'
            ? await getMonthlyFriendsCatches(ids)
            : await getAllFriendsCatches(ids);
        } else {
          catches = cat.period === 'month'
            ? await getMonthlyPublicCatches()
            : await getAllPublicCatches();
        }

        if (!cancelled) {
          setRankings(cat.rankFn(catches));
        }
      } catch (err) {
        console.error('Leaderboard load error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [scope, category, userProfile, user]);

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Leaderboard</h2>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${scope === 'all' ? styles.tabActive : ''}`}
          onClick={() => setScope('all')}
        >
          All Users
        </button>
        {user && (
          <button
            className={`${styles.tab} ${scope === 'friends' ? styles.tabActive : ''}`}
            onClick={() => setScope('friends')}
          >
            Friends
          </button>
        )}
        {user && userProfile?.region && (
          <button
            className={`${styles.tab} ${scope === 'local' ? styles.tabActive : ''}`}
            onClick={() => setScope('local')}
          >
            Local
          </button>
        )}
      </div>

      {scope === 'local' && userProfile?.region && (
        <p className={styles.regionLabel}>{userProfile.region}</p>
      )}
      {scope === 'local' && !userProfile?.region && (
        <p className={styles.regionLabel}>Set your region in Settings to see local rankings.</p>
      )}

      <div className={styles.categories}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            className={`${styles.categoryBtn} ${category === cat.key ? styles.categoryActive : ''}`}
            onClick={() => setCategory(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading && <SkeletonList count={5} />}

      {!loading && rankings.length === 0 && (
        <div className={styles.empty}>
          <p>No data for this category yet.</p>
        </div>
      )}

      {!loading && rankings.length > 0 && (
        <div className={styles.rankList}>
          {rankings.map((r) => {
            const isYou = user && r.userId === user.uid;
            return (
              <div
                key={r.userId}
                className={`${styles.rankRow} ${isYou ? styles.rankHighlight : ''}`}
              >
                <span className={styles.rankNum}>
                  {r.rank <= 3 ? MEDALS[r.rank] : `#${r.rank}`}
                </span>
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
                    {isYou && <span className={styles.youBadge}>You</span>}
                  </Link>
                  {r.species && <span className={styles.rankSpecies}>{r.species}</span>}
                </div>
                <span className={styles.rankValue}>{r.value}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
