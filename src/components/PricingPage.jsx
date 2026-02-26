import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTier } from '../hooks/useTier';
import { TIERS, TIER_ORDER } from '../config/tiers';
import styles from './PricingPage.module.css';

export default function PricingPage() {
  const { user } = useAuth();
  const { tier: currentTier } = useTier();
  const navigate = useNavigate();

  function handleSelect(tierKey) {
    if (!user) {
      navigate('/auth');
      return;
    }
    // Payment integration TBD — for now just show current status
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Choose Your Plan</h1>
      <p className={styles.subheading}>
        Start free, upgrade when you&rsquo;re ready. All plans include core catch logging and community features.
      </p>

      <div className={styles.grid}>
        {TIER_ORDER.map((key) => {
          const tier = TIERS[key];
          const isCurrent = user && currentTier === key;
          const isPopular = key === 'angler';

          return (
            <div
              key={key}
              className={`${styles.card} ${isPopular ? styles.popular : ''} ${isCurrent ? styles.current : ''}`}
            >
              {isPopular && <div className={styles.badge}>Most Popular</div>}
              {isCurrent && <div className={styles.currentBadge}>Current Plan</div>}

              <h2 className={styles.tierName}>{tier.name}</h2>
              <p className={styles.tierDesc}>{tier.description}</p>

              <div className={styles.price}>
                {tier.price === 0 ? (
                  <span className={styles.priceAmount}>Free</span>
                ) : (
                  <>
                    <span className={styles.priceCurrency}>$</span>
                    <span className={styles.priceAmount}>{tier.price.toFixed(2)}</span>
                    <span className={styles.pricePeriod}>/{tier.period}</span>
                  </>
                )}
              </div>

              <ul className={styles.features}>
                {tier.highlights.map((h) => (
                  <li key={h}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="#2e7d32" className={styles.check}>
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    {h}
                  </li>
                ))}
              </ul>

              <button
                className={`${styles.selectBtn} ${isPopular ? styles.selectBtnPopular : ''}`}
                onClick={() => handleSelect(key)}
                disabled={isCurrent}
              >
                {isCurrent ? 'Current Plan' : tier.price === 0 ? 'Get Started' : 'Coming Soon'}
              </button>
            </div>
          );
        })}
      </div>

      <p className={styles.note}>
        Paid plans are coming soon. All features are currently available for free during our beta period.
      </p>
    </div>
  );
}
