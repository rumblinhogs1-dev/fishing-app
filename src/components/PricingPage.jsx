import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTier } from '../hooks/useTier';
import { TIERS, TIER_ORDER } from '../config/tiers';
import styles from './PricingPage.module.css';

function AnnualSavings({ tier }) {
  if (!tier.price) return null;
  const monthlyCost = tier.price * 12;
  const saved = monthlyCost - tier.annualPrice;
  if (saved <= 0) return null;
  return <span className={styles.savingsBadge}>Save ${saved.toFixed(0)}/yr</span>;
}

export default function PricingPage() {
  const { user } = useAuth();
  const { tier: currentTier } = useTier();
  const navigate = useNavigate();
  const [annual, setAnnual] = useState(false);

  function handleSelect(tierKey) {
    if (!user) {
      navigate('/auth');
      return;
    }
    // Payment integration TBD — RevenueCat
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Choose Your Plan</h1>
      <p className={styles.subheading}>
        Start free and taste every feature. Upgrade when you&rsquo;re ready for more.
      </p>

      <div className={styles.toggleRow}>
        <span className={!annual ? styles.toggleActive : styles.toggleInactive}>Monthly</span>
        <button
          className={styles.toggleSwitch}
          onClick={() => setAnnual(!annual)}
          aria-label="Toggle annual billing"
        >
          <span className={`${styles.toggleKnob} ${annual ? styles.toggleKnobOn : ''}`} />
        </button>
        <span className={annual ? styles.toggleActive : styles.toggleInactive}>
          Annual <span className={styles.toggleDiscount}>Save 18%</span>
        </span>
      </div>

      <div className={styles.grid}>
        {TIER_ORDER.map((key) => {
          const tier = TIERS[key];
          const isCurrent = user && currentTier === key;
          const isPopular = key === 'angler';
          const displayPrice = annual ? tier.annualPrice : tier.price;
          const period = annual ? 'year' : 'month';

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
                {displayPrice === 0 ? (
                  <span className={styles.priceAmount}>Free</span>
                ) : (
                  <>
                    <span className={styles.priceCurrency}>$</span>
                    <span className={styles.priceAmount}>
                      {annual ? displayPrice : displayPrice.toFixed(2)}
                    </span>
                    <span className={styles.pricePeriod}>/{period}</span>
                  </>
                )}
              </div>
              {annual && <AnnualSavings tier={tier} />}

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

      <div className={styles.faqSection}>
        <h2 className={styles.faqHeading}>Pricing FAQ</h2>
        <details className={styles.faqItem}>
          <summary>Can I try features before upgrading?</summary>
          <p>Yes! The free plan includes limited access to every feature — AI Fish ID, Local Guide, Lure Recommendations, and Trip Planner. You can try them all before deciding to upgrade.</p>
        </details>
        <details className={styles.faqItem}>
          <summary>Can I switch plans or cancel anytime?</summary>
          <p>Absolutely. Upgrade, downgrade, or cancel at any time. No contracts, no hidden fees. If you cancel, you keep access through the end of your billing period.</p>
        </details>
        <details className={styles.faqItem}>
          <summary>What payment methods are accepted?</summary>
          <p>We accept all major credit cards, Apple Pay, and Google Pay through our secure payment processor.</p>
        </details>
        <details className={styles.faqItem}>
          <summary>Is there a discount for annual billing?</summary>
          <p>Yes — annual plans save you about 18% compared to monthly billing. Toggle the switch above to see annual pricing.</p>
        </details>
      </div>
    </div>
  );
}
