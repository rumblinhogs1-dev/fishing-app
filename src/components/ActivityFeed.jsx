import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFriends } from '../hooks/useFriends';
import { getPublicFeed, getFriendsFeed } from '../utils/activityFeed';
import FeedCatchCard from './FeedCatchCard';
import styles from './ActivityFeed.module.css';

export default function ActivityFeed() {
  const { user } = useAuth();
  const { userProfile } = useFriends();
  const [tab, setTab] = useState('public');
  const [catches, setCatches] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadFeed = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      let result;
      if (tab === 'friends' && userProfile?.friendIds?.length) {
        result = await getFriendsFeed(userProfile.friendIds, reset ? null : lastDoc);
      } else {
        result = await getPublicFeed(reset ? null : lastDoc);
      }
      setCatches((prev) => reset ? result.catches : [...prev, ...result.catches]);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setLoading(false);
    }
  }, [tab, lastDoc, userProfile]);

  useEffect(() => {
    setCatches([]);
    setLastDoc(null);
    setHasMore(false);
    loadFeed(true);
  }, [tab]);

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Activity Feed</h2>

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

      {catches.length === 0 && !loading && (
        <div className={styles.empty}>
          <p>{tab === 'friends' ? 'No catches from friends yet.' : 'No public catches yet.'}</p>
        </div>
      )}

      <div className={styles.feedList}>
        {catches.map((c) => (
          <FeedCatchCard key={c.id} entry={c} />
        ))}
      </div>

      {loading && <p className={styles.loadingText}>Loading...</p>}

      {hasMore && !loading && (
        <button className={styles.loadMoreBtn} onClick={() => loadFeed(false)}>
          Load More
        </button>
      )}
    </div>
  );
}
