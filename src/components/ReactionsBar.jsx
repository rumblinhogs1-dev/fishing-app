import { useAuth } from '../contexts/AuthContext';
import { useReactions } from '../hooks/useReactions';
import { toggleReaction, REACTION_EMOJIS } from '../utils/reactions';
import styles from './ReactionsBar.module.css';

export default function ReactionsBar({ catchId, reactionCounts }) {
  const { user } = useAuth();
  const { reactions } = useReactions(catchId);

  const userReaction = reactions.find((r) => r.userId === user?.uid);

  async function handleReact(emoji) {
    if (!user) return;
    await toggleReaction(catchId, user.uid, emoji);
  }

  // Merge Firestore counts with live reactions for display
  const counts = { ...reactionCounts };
  Object.keys(REACTION_EMOJIS).forEach((key) => {
    if (!counts[key]) counts[key] = 0;
  });

  return (
    <div className={styles.bar}>
      {Object.entries(REACTION_EMOJIS).map(([key, emoji]) => {
        const count = counts[key] || 0;
        const isActive = userReaction?.emoji === key;
        return (
          <button
            key={key}
            className={`${styles.reaction} ${isActive ? styles.active : ''}`}
            onClick={() => handleReact(key)}
            disabled={!user}
            title={key}
          >
            <span className={styles.emoji}>{emoji}</span>
            {count > 0 && <span className={styles.count}>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
