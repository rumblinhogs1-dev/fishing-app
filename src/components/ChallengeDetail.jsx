import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  joinChallenge,
  leaveChallenge,
  deleteChallenge,
  computeChallengeLeaderboard,
} from '../utils/challenges';
import { useToast } from '../contexts/ToastContext';
import { SkeletonList } from './Skeleton';
import styles from './ChallengeDetail.module.css';

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

const MEDALS = ['', '\u{1F947}', '\u{1F948}', '\u{1F949}'];

function formatDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function CountdownTimer({ endDate }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    function update() {
      const end = endDate?.toDate ? endDate.toDate() : new Date(endDate);
      const diff = end - new Date();
      if (diff <= 0) {
        setTimeLeft('Ended');
        return;
      }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h remaining`);
      } else {
        setTimeLeft(`${hours}h ${mins}m remaining`);
      }
    }
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [endDate]);

  return (
    <div className={styles.countdown}>
      <div className={styles.countdownLabel}>Time Left</div>
      <div className={styles.timer}>{timeLeft}</div>
    </div>
  );
}

export default function ChallengeDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [lbLoading, setLbLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Real-time subscription to challenge doc
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'challenges', id), (snap) => {
      if (snap.exists()) {
        setChallenge({ id: snap.id, ...snap.data() });
      } else {
        setChallenge(null);
      }
      setLoading(false);
    });
    return unsub;
  }, [id]);

  // Load leaderboard for active challenges
  useEffect(() => {
    if (!challenge) return;

    if (challenge.status === 'completed' && challenge.results) {
      setLeaderboard(challenge.results);
      return;
    }

    if (challenge.status === 'active') {
      let cancelled = false;
      async function loadLb() {
        setLbLoading(true);
        try {
          const results = await computeChallengeLeaderboard(challenge);
          if (!cancelled) setLeaderboard(results);
        } catch (err) {
          console.error('Leaderboard load error:', err);
        } finally {
          if (!cancelled) setLbLoading(false);
        }
      }
      loadLb();
      const interval = setInterval(loadLb, 60000);
      return () => {
        cancelled = true;
        clearInterval(interval);
      };
    }
  }, [challenge?.id, challenge?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className={styles.container}>
        <SkeletonList count={3} />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className={styles.container}>
        <Link to="/challenges" className={styles.backLink}>Back to Challenges</Link>
        <div className={styles.empty}><p>Challenge not found.</p></div>
      </div>
    );
  }

  const isParticipant = user && challenge.participants?.some((p) => p.userId === user.uid);
  const isCreator = user && challenge.createdBy === user.uid;
  const canJoin = user && !isParticipant && challenge.status !== 'completed';
  const canLeave = isParticipant && !isCreator && challenge.status !== 'completed';

  async function handleJoin() {
    setActionLoading(true);
    try {
      await joinChallenge(challenge.id, user.uid, {
        displayName: user.displayName,
        photoURL: user.photoURL,
      });
      toast.success('Joined challenge!');
    } catch (err) {
      toast.error('Failed to join');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleLeave() {
    setActionLoading(true);
    try {
      await leaveChallenge(challenge.id, user.uid, challenge.participants);
      toast.success('Left challenge');
    } catch (err) {
      toast.error('Failed to leave');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this challenge? This cannot be undone.')) return;
    setActionLoading(true);
    try {
      await deleteChallenge(challenge.id);
      toast.success('Challenge deleted');
      navigate('/challenges');
    } catch (err) {
      toast.error('Failed to delete');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <Link to="/challenges" className={styles.backLink}>&larr; Back to Challenges</Link>

      <div className={styles.header}>
        <h1 className={styles.title}>{challenge.name}</h1>
        <div className={styles.badges}>
          <span className={`${styles.typeBadge} ${TYPE_CLASSES[challenge.type] || ''}`}>
            {TYPE_LABELS[challenge.type] || challenge.type}
          </span>
          <span className={`${styles.statusBadge} ${STATUS_CLASSES[challenge.status] || ''}`}>
            {challenge.status}
          </span>
        </div>
      </div>

      {challenge.description && (
        <p className={styles.description}>{challenge.description}</p>
      )}

      <div className={styles.meta}>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Created by</span>
          <span>{challenge.creatorDisplayName || 'Angler'}</span>
        </div>
        {challenge.targetSpecies && (
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Target Species</span>
            <span>{challenge.targetSpecies}</span>
          </div>
        )}
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Start</span>
          <span>{formatDate(challenge.startDate)}</span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>End</span>
          <span>{formatDate(challenge.endDate)}</span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Participants</span>
          <span>{challenge.participantCount || 0}</span>
        </div>
      </div>

      {challenge.status === 'active' && <CountdownTimer endDate={challenge.endDate} />}

      {(canJoin || canLeave || isCreator) && (
        <div className={styles.actions}>
          {canJoin && (
            <button className={styles.joinBtn} onClick={handleJoin} disabled={actionLoading}>
              {actionLoading ? 'Joining...' : 'Join Challenge'}
            </button>
          )}
          {canLeave && (
            <button className={styles.leaveBtn} onClick={handleLeave} disabled={actionLoading}>
              {actionLoading ? 'Leaving...' : 'Leave Challenge'}
            </button>
          )}
          {isCreator && (
            <button className={styles.deleteBtn} onClick={handleDelete} disabled={actionLoading}>
              Delete
            </button>
          )}
        </div>
      )}

      {challenge.participants?.length > 0 && (
        <div className={styles.participants}>
          <h3 className={styles.sectionTitle}>Participants</h3>
          <div className={styles.avatarRow}>
            {challenge.participants.map((p) => (
              <Link key={p.userId} to={`/user/${p.userId}`} className={styles.avatarLink} title={p.displayName}>
                {p.photoURL ? (
                  <img src={p.photoURL} alt={p.displayName} className={styles.avatar} referrerPolicy="no-referrer" />
                ) : (
                  <span className={styles.avatarInitial}>
                    {(p.displayName || '?')[0].toUpperCase()}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {(challenge.status === 'active' || challenge.status === 'completed') && (
        <>
          <h3 className={styles.sectionTitle}>
            {challenge.status === 'completed' ? 'Final Results' : 'Live Leaderboard'}
          </h3>

          {lbLoading && <SkeletonList count={3} />}

          {!lbLoading && leaderboard.length === 0 && (
            <div className={styles.empty}><p>No results yet.</p></div>
          )}

          {!lbLoading && leaderboard.length > 0 && (
            <div className={styles.rankList}>
              {leaderboard.map((r) => {
                const isYou = user && r.userId === user.uid;
                const isWinner = challenge.status === 'completed' && r.rank === 1;
                return (
                  <div
                    key={r.userId}
                    className={`${styles.rankRow} ${isYou ? styles.rankHighlight : ''} ${isWinner ? styles.rankWinner : ''}`}
                  >
                    <span className={styles.rankNum}>
                      {r.rank <= 3 ? MEDALS[r.rank] : `#${r.rank}`}
                    </span>
                    {r.photoURL ? (
                      <img src={r.photoURL} alt="" className={styles.rankAvatar} referrerPolicy="no-referrer" />
                    ) : (
                      <span className={styles.rankAvatarInitial}>
                        {(r.displayName || '?')[0].toUpperCase()}
                      </span>
                    )}
                    <div className={styles.rankInfo}>
                      <Link to={`/user/${r.userId}`} className={styles.rankName}>
                        {r.displayName}
                        {isYou && <span className={styles.youBadge}>You</span>}
                      </Link>
                    </div>
                    <span className={styles.rankValue}>{r.value}</span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
