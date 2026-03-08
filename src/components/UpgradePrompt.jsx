import { useNavigate } from 'react-router-dom';
import { useTier } from '../hooks/useTier';
import { TIERS, TIER_ORDER } from '../config/tiers';
import styles from './UpgradePrompt.module.css';

function getRequiredTierName(feature) {
  for (const tierKey of TIER_ORDER) {
    const tier = TIERS[tierKey];
    const val = tier.features[feature];
    if (val === true || (typeof val === 'number' && val > 0)) {
      return tier.name;
    }
  }
  return 'Angler';
}

/**
 * Renders children if the user's tier has access to the given feature.
 * In soft mode (default): shows a banner but still renders children.
 * In hard mode: shows a blocking overlay.
 */
export default function UpgradePrompt({ feature, featureLabel, soft = true, children }) {
  const { canUse, loading } = useTier();
  const navigate = useNavigate();

  if (loading) return children;

  if (canUse(feature)) return children;

  const requiredTier = getRequiredTierName(feature);

  if (soft) {
    return (
      <>
        <div className={styles.softBanner}>
          <span className={styles.softBadge}>{requiredTier}</span>
          <span className={styles.softText}>
            {featureLabel || feature} is a {requiredTier} feature
          </span>
          <button className={styles.softUpgradeBtn} onClick={() => navigate('/pricing')}>
            View Plans
          </button>
        </div>
        {children}
      </>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.overlay}>
        <div className={styles.card}>
          <div className={styles.icon}>
            <svg viewBox="0 0 24 24" width="48" height="48" fill="#2d6a4f">
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

export function PremiumBadge({ feature }) {
  const { canUse, loading } = useTier();

  if (loading || canUse(feature)) return null;

  const requiredTier = getRequiredTierName(feature);

  return <span className={styles.inlineBadge}>{requiredTier}</span>;
}
