import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useChallenges } from '../hooks/useChallenges';
import { subscribeToPublicChallenges, refreshChallengeStatuses } from '../utils/challenges';
import { SkeletonList } from './Skeleton';
import CreateChallengeForm from './CreateChallengeForm';
import styles from './Challenges.module.css';

const TYPE_LABELS = {
  most_catches: 'Most Catches',
  biggest_catch: 'Biggest Catch',
  most_species: 'Most Species',
  total_weight: 'Total Weight',
  longest_fish: 'Longest Fish',
};

const TYPE_CLASSES = {
  most_catches: styles.typeMostCatches,
  biggest_catch: styles.typeBiggestCatch,
  most_species: styles.typeMostSpecies,
  total_weight: styles.typeTotalWeight,
  longest_fish: styles.typeLongestFish,
};

const STATUS_CLASSES = {
  upcoming: styles.statusUpcoming,
  active: styles.statusActive,
  completed: styles.statusCompleted,
};

function formatDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Challenges() {
  const { user } = useAuth();
  const { challenges: userChallenges, loading: userLoading } = useChallenges();
  const [publicChallenges, setPublicChallenges] = useState([]);
  const [publicLoading, setPublicLoading] = useState(true);
  const [tab, setTab] = useState('active');
  const [showForm, setShowForm] = useState(false);

  // Subscribe to public challenges for non-auth users
  useEffect(() => {
    if (user) {
      setPublicLoading(false);
      return;
    }
    const unsub = subscribeToPublicChallenges((data) => {
      setPublicChallenges(data);
      setPublicLoading(false);
    });
    return unsub;
  }, [user]);

  const allChallenges = user ? userChallenges : publicChallenges;
  const loading = user ? userLoading : publicLoading;

  // Refresh statuses on mount
  useEffect(() => {
    if (!loading && allChallenges.length > 0) {
      refreshChallengeStatuses(allChallenges);
    }
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = allChallenges.filter((c) => {
    if (tab === 'mine') return user && c.createdBy === user.uid;
    return c.status === tab;
  });

  const TABS = [
    { key: 'active', label: 'Active' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'completed', label: 'Completed' },
  ];
  if (user) TABS.push({ key: 'mine', label: 'My Challenges' });

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Challenges</h2>

      <div className={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`${styles.tab} ${tab === t.key ? styles.tabActive : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {user && !showForm && (
        <button className={styles.createBtn} onClick={() => setShowForm(true)}>
          + Create Challenge
        </button>
      )}

      {showForm && <CreateChallengeForm onClose={() => setShowForm(false)} />}

      {loading && <SkeletonList count={3} />}

      {!loading && filtered.length === 0 && (
        <div className={styles.empty}>
          <p>
            {tab === 'active' && 'No active challenges right now.'}
            {tab === 'upcoming' && 'No upcoming challenges.'}
            {tab === 'completed' && 'No completed challenges yet.'}
            {tab === 'mine' && 'You haven\'t created any challenges yet.'}
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className={styles.challengeList}>
          {filtered.map((c) => (
            <Link key={c.id} to={`/challenge/${c.id}`} className={styles.challengeCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{c.name}</h3>
                <div className={styles.badges}>
                  <span className={`${styles.typeBadge} ${TYPE_CLASSES[c.type] || ''}`}>
                    {TYPE_LABELS[c.type] || c.type}
                  </span>
                  <span className={`${styles.statusBadge} ${STATUS_CLASSES[c.status] || ''}`}>
                    {c.status}
                  </span>
                </div>
              </div>
              <div className={styles.cardMeta}>
                <span>{formatDate(c.startDate)} - {formatDate(c.endDate)}</span>
                <span>{c.participantCount || 0} participant{c.participantCount !== 1 ? 's' : ''}</span>
                <span>by {c.creatorDisplayName || 'Angler'}</span>
                {c.targetSpecies && <span>Target: {c.targetSpecies}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
