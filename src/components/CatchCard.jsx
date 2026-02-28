import { useNavigate } from 'react-router-dom';
import { updateCatch } from '../utils/firestore';
import { useToast } from '../contexts/ToastContext';
import styles from './CatchCard.module.css';

export default function CatchCard({ entry, onDelete }) {
  const navigate = useNavigate();
  const toast = useToast();
  const d = entry.date ? new Date(entry.date) : null;
  const dateStr = d
    ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';
  const timeStr = d
    ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : '';

  const isPublic = entry.visibility === 'public';

  async function handleToggleVisibility() {
    try {
      await updateCatch(entry.id, { visibility: isPublic ? 'private' : 'public' });
      toast.success('Visibility updated');
    } catch (err) {
      toast.error('Failed to update visibility');
    }
  }

  return (
    <div className={styles.card}>
      {(entry.imageUrl || entry.image) && (
        <img src={entry.imageUrl || entry.image} alt={entry.species} className={styles.photo} />
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
        {entry.aiEstimatedAge && (
          <span className={styles.tag}>Age: {entry.aiEstimatedAge}</span>
        )}
      </div>

      {entry.notes && <p className={styles.notes}>{entry.notes}</p>}

      <div className={styles.footer}>
        {dateStr && <span>{dateStr}</span>}
        {timeStr && <span>{timeStr}</span>}
        {entry.visibility && entry.visibility !== 'public' && (
          <span className={styles.visibilityBadge}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 3, verticalAlign: -1 }}>
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
            {entry.visibility}
          </span>
        )}
        <label className={styles.visibilityToggle} onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            className={styles.toggleInput}
            checked={isPublic}
            onChange={handleToggleVisibility}
          />
          <span className={styles.toggleSlider} />
          <span className={styles.toggleLabel}>{isPublic ? 'Public' : 'Private'}</span>
        </label>
      </div>
    </div>
  );
}
