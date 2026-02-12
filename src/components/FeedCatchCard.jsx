import { Link } from 'react-router-dom';
import styles from './FeedCatchCard.module.css';

export default function FeedCatchCard({ entry }) {
  const d = entry.date ? new Date(entry.date) : null;
  const dateStr = d
    ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  const img = entry.imageUrl || entry.image;

  return (
    <div className={styles.card}>
      <div className={styles.author}>
        {entry.authorPhotoURL ? (
          <img src={entry.authorPhotoURL} alt="" className={styles.authorAvatar} referrerPolicy="no-referrer" />
        ) : (
          <span className={styles.authorInitial}>
            {(entry.authorDisplayName || '?')[0].toUpperCase()}
          </span>
        )}
        <div className={styles.authorInfo}>
          <Link to={`/user/${entry.userId}`} className={styles.authorName}>
            {entry.authorDisplayName || 'Angler'}
          </Link>
          <span className={styles.authorDate}>{dateStr}</span>
        </div>
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
        </div>
        {entry.notes && <p className={styles.notes}>{entry.notes}</p>}
        <Link to={`/catch/${entry.id}`} className={styles.viewLink}>View details</Link>
      </div>
    </div>
  );
}
