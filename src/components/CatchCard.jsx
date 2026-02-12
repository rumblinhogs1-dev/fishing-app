import { useNavigate } from 'react-router-dom';
import styles from './CatchCard.module.css';

export default function CatchCard({ entry, onDelete }) {
  const navigate = useNavigate();
  const d = entry.date ? new Date(entry.date) : null;
  const dateStr = d
    ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';
  const timeStr = d
    ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : '';

  return (
    <div className={styles.card}>
      {entry.image && (
        <img src={entry.image} alt={entry.species} className={styles.photo} />
      )}
      <div className={styles.header}>
        <h3 className={styles.species}>{entry.species}</h3>
        <div className={styles.actions}>
          <button className={styles.editBtn} onClick={() => navigate(`/edit/${entry.id}`)} title="Edit">
            &#9998;
          </button>
          <button className={styles.deleteBtn} onClick={() => onDelete(entry.id)} title="Delete">
            &times;
          </button>
        </div>
      </div>

      <div className={styles.details}>
        {entry.weight && (
          <span className={styles.tag}>{entry.weight} lbs</span>
        )}
        {entry.length && (
          <span className={styles.tag}>{entry.length} in</span>
        )}
        {entry.location && (
          <span className={styles.tag}>{entry.location}</span>
        )}
        {entry.weather && (
          <span className={styles.tag}>{entry.weather}</span>
        )}
        {entry.bait && (
          <span className={styles.tag}>{entry.bait}</span>
        )}
        {entry.lureName && (
          <span className={styles.lureTag}>{entry.lureName}</span>
        )}
        {entry.lureType && entry.lureType !== entry.lureName && (
          <span className={styles.lureTag}>{entry.lureType}</span>
        )}
        {entry.lureColor && (
          <span className={styles.lureTag}>{entry.lureColor}</span>
        )}
        {entry.waterTemp && (
          <span className={styles.waterTag}>Water: {entry.waterTemp}°F</span>
        )}
        {entry.flowRate && (
          <span className={styles.waterTag}>Flow: {entry.flowRate} ft³/s</span>
        )}
      </div>

      {entry.notes && <p className={styles.notes}>{entry.notes}</p>}

      <div className={styles.footer}>
        {dateStr && <span>{dateStr}</span>}
        {timeStr && <span>{timeStr}</span>}
        {entry.visibility && entry.visibility !== 'public' && (
          <span className={styles.visibilityBadge}>{entry.visibility}</span>
        )}
      </div>
    </div>
  );
}
