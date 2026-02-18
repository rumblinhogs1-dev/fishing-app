import { Link } from 'react-router-dom';
import styles from './MapView.module.css';

export default function MapView() {
  return (
    <div className={styles.container}>
      <div className={styles.placeholder}>
        <div className={styles.placeholderIcon}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="#1a73e8">
            <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/>
          </svg>
        </div>
        <h3 className={styles.placeholderTitle}>Interactive Map</h3>
        <p className={styles.placeholderText}>
          The map feature is coming soon! You'll be able to view catch locations,
          fishing spots, water conditions, and more.
        </p>
        <div className={styles.placeholderLinks}>
          <Link to="/spots" className={styles.placeholderLink}>View Saved Spots</Link>
          <Link to="/forecast" className={styles.placeholderLink}>Check Forecast</Link>
        </div>
      </div>
    </div>
  );
}
