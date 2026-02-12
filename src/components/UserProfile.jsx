import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { getUserProfile, sendFriendRequest } from '../utils/friends';
import { useAuth } from '../contexts/AuthContext';
import FeedCatchCard from './FeedCatchCard';
import styles from './UserProfile.module.css';

export default function UserProfile() {
  const { userId } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [catches, setCatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestSent, setRequestSent] = useState(false);

  const isOwn = user?.uid === userId;
  const isFriend = profile?.friendIds?.includes(user?.uid);

  useEffect(() => {
    async function load() {
      try {
        const p = await getUserProfile(userId);
        setProfile(p);

        const visFilters = ['public'];
        if (isFriend || isOwn) visFilters.push('friends');
        if (isOwn) visFilters.push('private');

        const q = query(
          collection(db, 'catches'),
          where('userId', '==', userId),
          where('visibility', 'in', visFilters),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        setCatches(snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate?.()?.toISOString() || null,
        })));
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  async function handleAddFriend() {
    if (!user) return;
    try {
      await sendFriendRequest(user.uid, userId);
      setRequestSent(true);
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) return <p className={styles.loading}>Loading...</p>;
  if (!profile) return <p className={styles.loading}>User not found.</p>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.avatarSection}>
          {profile.photoURL ? (
            <img src={profile.photoURL} alt="" className={styles.avatar} referrerPolicy="no-referrer" />
          ) : (
            <span className={styles.avatarInitial}>
              {(profile.displayName || '?')[0].toUpperCase()}
            </span>
          )}
          <div className={styles.info}>
            <h2 className={styles.name}>{profile.displayName || 'Angler'}</h2>
            {profile.bio && <p className={styles.bio}>{profile.bio}</p>}
          </div>
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{catches.length}</span>
            <span className={styles.statLabel}>Catches</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{profile.friendCount || 0}</span>
            <span className={styles.statLabel}>Friends</span>
          </div>
        </div>

        {user && !isOwn && !isFriend && (
          <button className={styles.friendBtn} onClick={handleAddFriend} disabled={requestSent}>
            {requestSent ? 'Request Sent' : 'Add Friend'}
          </button>
        )}
        {isFriend && <span className={styles.friendBadge}>Friends</span>}
      </div>

      <div className={styles.catches}>
        {catches.length === 0 ? (
          <p className={styles.empty}>No catches to show.</p>
        ) : (
          catches.map((c) => <FeedCatchCard key={c.id} entry={c} />)
        )}
      </div>
    </div>
  );
}
