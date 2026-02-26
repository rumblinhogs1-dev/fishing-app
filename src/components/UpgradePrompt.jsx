import { useNavigate } from 'react-router-dom';
import { useTier } from '../hooks/useTier';
import styles from './UpgradePrompt.module.css';

/**
 * Renders children if the user's tier has access to the given feature.
 * Otherwise shows an upgrade prompt overlay.
 *
 * Usage:
 *   <UpgradePrompt feature="localGuide" featureLabel="Local Guide">
 *     <LocalGuide />
 *   </UpgradePrompt>
 */
export default function UpgradePrompt({ feature, featureLabel, children }) {
  const { canUse, loading } = useTier();
  const navigate = useNavigate();

  if (loading) return children;

  if (canUse(feature)) return children;

  return (
    <div className={styles.wrapper}>
      <div className={styles.overlay}>
        <div className={styles.card}>
          <div className={styles.icon}>
            <svg viewBox="0 0 24 24" width="48" height="48" fill="#1a73e8">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
            </svg>
          </div>
          <h3 className={styles.title}>Upgrade to Unlock</h3>
          <p className={styles.description}>
            <strong>{featureLabel || feature}</strong> is available on a paid plan.
            Upgrade to get access to this feature and more.
          </p>
          <button className={styles.upgradeBtn} onClick={() => navigate('/pricing')}>
            View Plans
          </button>
        </div>
      </div>
    </div>
  );
}
