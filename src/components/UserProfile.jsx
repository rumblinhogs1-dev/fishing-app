import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { getUserProfile, sendFriendRequest } from '../utils/friends';
import { useAuth } from '../contexts/AuthContext';
import FeedCatchCard from './FeedCatchCard';
import ConservationBadges from './ConservationBadges';
import styles from './UserProfile.module.css';

export default function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
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

        const fetchedIsFriend = p?.friendIds?.includes(user?.uid);
        const visFilters = ['public'];
        if (fetchedIsFriend || isOwn) visFilters.push('friends');
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

  const extraStats = useMemo(() => {
    if (!catches.length) return { releaseRate: 0, topSpecies: null, biggest: null };
    const withField = catches.filter((c) => c.released !== undefined);
    const released = catches.filter((c) => c.released === true);
    const releaseRate = withField.length > 0 ? Math.round((released.length / withField.length) * 100) : 0;

    const speciesCount = {};
    catches.forEach((c) => {
      if (c.species) {
        const s = c.species.trim().toLowerCase();
        speciesCount[s] = (speciesCount[s] || 0) + 1;
      }
    });
    const topEntry = Object.entries(speciesCount).sort((a, b) => b[1] - a[1])[0];
    const topSpecies = topEntry ? topEntry[0] : null;

    const withWeight = catches.filter((c) => c.weight);
    const biggest = withWeight.length ? withWeight.reduce((a, b) => (a.weight > b.weight ? a : b)) : null;

    return { releaseRate, topSpecies, biggest };
  }, [catches]);

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

  const memberSince = profile.createdAt?.toDate
    ? profile.createdAt.toDate().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : profile.createdAt
      ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : null;

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={() => navigate(-1)}>
        &larr; Back
      </button>
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
            <div className={styles.meta}>
              {profile.region && <span className={styles.metaItem}>{profile.region}</span>}
              {memberSince && <span className={styles.metaItem}>Member since {memberSince}</span>}
            </div>
          </div>
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{catches.length}</span>
            <span className={styles.statLabel}>Catches</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{catches.filter((c) => c.released).length}</span>
            <span className={styles.statLabel}>Released</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{extraStats.releaseRate}%</span>
            <span className={styles.statLabel}>Release Rate</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{profile.friendCount || 0}</span>
            <span className={styles.statLabel}>Friends</span>
          </div>
        </div>

        {(extraStats.topSpecies || extraStats.biggest) && (
          <div className={styles.highlights}>
            {extraStats.topSpecies && (
              <span className={styles.highlight}>Top: {extraStats.topSpecies}</span>
            )}
            {extraStats.biggest && (
              <span className={styles.highlight}>PB: {extraStats.biggest.weight} lbs {extraStats.biggest.species || ''}</span>
            )}
          </div>
        )}

        {user && !isOwn && !isFriend && (
          <button className={styles.friendBtn} onClick={handleAddFriend} disabled={requestSent}>
            {requestSent ? 'Request Sent' : 'Add Friend'}
          </button>
        )}
        {isFriend && <span className={styles.friendBadge}>Friends</span>}
        {isOwn && (
          <Link to="/settings" className={styles.editBtn}>Edit Profile</Link>
        )}
      </div>

      <ConservationBadges
        catches={catches}
        earnedBadges={profile?.earnedBadges || {}}
        userId={userId}
        isOwn={isOwn}
      />

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
