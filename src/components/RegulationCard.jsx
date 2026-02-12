import styles from './RegulationCard.module.css';

export default function RegulationCard({ rule }) {
  const statusClass = rule.status === 'open' ? styles.open : rule.status === 'closed' ? styles.closed : styles.restricted;

  return (
    <div className={`${styles.card} ${statusClass}`}>
      <div className={styles.header}>
        <h4 className={styles.name}>{rule.name}</h4>
        <span className={`${styles.statusBadge} ${statusClass}`}>
          {rule.status === 'open' ? 'Open' : rule.status === 'closed' ? 'Closed' : 'Restricted'}
        </span>
      </div>
      <div className={styles.details}>
        {rule.minLength && (
          <div className={styles.detail}>
            <span className={styles.label}>Min Length</span>
            <span className={styles.value}>{rule.minLength}"</span>
          </div>
        )}
        {rule.maxLength && (
          <div className={styles.detail}>
            <span className={styles.label}>Max Length</span>
            <span className={styles.value}>{rule.maxLength}"</span>
          </div>
        )}
        {rule.dailyLimit && (
          <div className={styles.detail}>
            <span className={styles.label}>Daily Limit</span>
            <span className={styles.value}>{rule.dailyLimit}</span>
          </div>
        )}
        {rule.season && (
          <div className={styles.detail}>
            <span className={styles.label}>Season</span>
            <span className={styles.value}>{rule.season}</span>
          </div>
        )}
      </div>
    </div>
  );
}
