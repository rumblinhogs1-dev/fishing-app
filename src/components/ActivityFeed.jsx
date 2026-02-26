import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFriends } from '../hooks/useFriends';
import { getPublicFeed, getFriendsFeed, getPublicFeedFiltered, getPopularSpecies } from '../utils/activityFeed';
import FeedCatchCard from './FeedCatchCard';
import CommunityImpact from './CommunityImpact';
import { SkeletonList } from './Skeleton';
import styles from './ActivityFeed.module.css';

export default function ActivityFeed() {
  const { user } = useAuth();
  const { userProfile } = useFriends();
  const [tab, setTab] = useState('public');
  const [catches, setCatches] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [speciesFilter, setSpeciesFilter] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [speciesList, setSpeciesList] = useState([]);
  const sentinelRef = useRef(null);
  const loadingRef = useRef(false);
  const lastDocRef = useRef(null);

  useEffect(() => {
    getPopularSpecies().then(setSpeciesList).catch(() => {});
  }, []);

  const loadFeed = useCallback(async (reset = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const cursor = reset ? null : lastDocRef.current;
      let result;
      if (tab === 'friends' && userProfile?.friendIds?.length) {
        result = await getFriendsFeed(userProfile.friendIds, cursor);
      } else if (speciesFilter) {
        result = await getPublicFeedFiltered(cursor, 20, speciesFilter);
      } else {
        result = await getPublicFeed(cursor);
      }
      setCatches((prev) => reset ? result.catches : [...prev, ...result.catches]);
      lastDocRef.current = result.lastDoc;
      setHasMore(result.hasMore);
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [tab, userProfile, speciesFilter]);

  useEffect(() => {
    setCatches([]);
    lastDocRef.current = null;
    setHasMore(false);
    loadFeed(true);
  }, [tab, speciesFilter]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!hasMore || loading) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadFeed(false);
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadFeed]);

  const displayed = useMemo(() => {
    if (!locationSearch.trim()) return catches;
    const q = locationSearch.toLowerCase();
    return catches.filter((c) => c.location && c.location.toLowerCase().includes(q));
  }, [catches, locationSearch]);

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Activity Feed</h2>

      <CommunityImpact />

      {user && (
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'public' ? styles.tabActive : ''}`}
            onClick={() => setTab('public')}
          >
            Public
          </button>
          <button
            className={`${styles.tab} ${tab === 'friends' ? styles.tabActive : ''}`}
            onClick={() => setTab('friends')}
          >
            Friends
          </button>
        </div>
      )}

      {tab === 'public' && (
        <div className={styles.filters}>
          <select
            className={styles.filterSelect}
            value={speciesFilter}
            onChange={(e) => setSpeciesFilter(e.target.value)}
          >
            <option value="">All Species</option>
            {speciesList.map((sp) => (
              <option key={sp} value={sp}>{sp}</option>
            ))}
          </select>
          <input
            type="text"
            className={styles.filterSearch}
            placeholder="Filter by location..."
            value={locationSearch}
            onChange={(e) => setLocationSearch(e.target.value)}
          />
        </div>
      )}

      {displayed.length === 0 && !loading && (
        <div className={styles.empty}>
          <p>{tab === 'friends' ? 'No catches from friends yet.' : 'No public catches yet.'}</p>
        </div>
      )}

      <div className={styles.feedList}>
        {displayed.map((c) => (
          <FeedCatchCard key={c.id} entry={c} />
        ))}
      </div>

      {loading && <SkeletonList count={3} />}

      {hasMore && !loading && (
        <div ref={sentinelRef} className={styles.sentinel} />
      )}

      {!hasMore && catches.length > 0 && !loading && (
        <p className={styles.endText}>You've reached the end</p>
      )}
    </div>
  );
}
