import { Link } from 'react-router-dom';
import ReactionsBar from './ReactionsBar';
import styles from './FeedCatchCard.module.css';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export default function FeedCatchCard({ entry }) {
  const img = entry.imageUrl || entry.image;
  const relTime = timeAgo(entry.createdAt || entry.date);

  return (
    <div className={styles.card}>
      <div className={styles.author}>
        <Link to={`/user/${entry.userId}`} className={styles.authorLink}>
          {entry.authorPhotoURL ? (
            <img src={entry.authorPhotoURL} alt="" className={styles.authorAvatar} referrerPolicy="no-referrer" />
          ) : (
            <span className={styles.authorInitial}>
              {(entry.authorDisplayName || '?')[0].toUpperCase()}
            </span>
          )}
          <div className={styles.authorInfo}>
            <span className={styles.authorName}>
              {entry.authorDisplayName || 'Angler'}
            </span>
            <span className={styles.authorDate}>{relTime}</span>
          </div>
        </Link>
        {entry.visibility && (
          <span className={styles.visibilityBadge}>{entry.visibility}</span>
        )}
      </div>

      {img && <img src={img} alt={entry.species} className={styles.photo} />}

      <div className={styles.body}>
        <h3 className={styles.species}>{entry.species}</h3>
        <div className={styles.details}>
          {entry.weight && <span className={styles.tag}>{entry.weight} lbs</span>}
          {entry.length && <span className={styles.tag}>{entry.length} in</span>}
          {entry.location && <span className={styles.tag}>{entry.location}</span>}
          {entry.bait && <span className={styles.tag}>{entry.bait}</span>}
          {entry.lureName && <span className={styles.lureTag}>{entry.lureName}</span>}
          {entry.released && <span className={styles.releasedTag}>Released</span>}
        </div>
        {entry.notes && <p className={styles.notes}>{entry.notes}</p>}
        <Link to={`/catch/${entry.id}`} className={styles.viewLink}>View details</Link>
        <div className={styles.reactionsRow}>
          <ReactionsBar catchId={entry.id} reactionCounts={entry.reactionCounts || {}} />
        </div>
      </div>
    </div>
  );
}
