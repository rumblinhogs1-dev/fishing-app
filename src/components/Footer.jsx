import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.links}>
        <Link to="/terms">Terms of Service</Link>
        <span className={styles.divider}>|</span>
        <Link to="/privacy">Privacy Policy</Link>
        <span className={styles.divider}>|</span>
        <Link to="/pricing">Pricing</Link>
      </div>
      <p className={styles.copy}>&copy; 2026 MyCatchBook. All rights reserved.</p>
    </footer>
  );
}
