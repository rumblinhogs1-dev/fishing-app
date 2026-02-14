import styles from './Skeleton.module.css';

export function Skeleton({ width, height, borderRadius, style }) {
  return (
    <div
      className={styles.skeleton}
      style={{
        width: width || '100%',
        height: height || '16px',
        borderRadius: borderRadius || '4px',
        ...style,
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className={styles.card}>
      <div className={`${styles.skeleton} ${styles.cardPhoto}`} />
      <div className={`${styles.skeleton} ${styles.cardLine}`} style={{ width: '80%' }} />
      <div className={`${styles.skeleton} ${styles.cardLine}`} style={{ width: '60%' }} />
      <div className={`${styles.skeleton} ${styles.cardLine}`} style={{ width: '40%' }} />
    </div>
  );
}

export function SkeletonList({ count = 3 }) {
  return (
    <div className={styles.list}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonText({ lines = 4 }) {
  return (
    <div>
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className={`${styles.skeleton} ${styles.textLine}`}
          style={i === lines - 1 ? { width: '70%' } : undefined}
        />
      ))}
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div>
      <div className={styles.statsGrid}>
        {[1, 2, 3].map((i) => (
          <div key={i} className={styles.statsBox}>
            <div className={`${styles.skeleton} ${styles.statsValue}`} />
            <div className={`${styles.skeleton} ${styles.statsLabel}`} />
          </div>
        ))}
      </div>
      <div className={styles.statsChart}>
        <div className={`${styles.skeleton} ${styles.statsChartTitle}`} />
        <div className={`${styles.skeleton} ${styles.statsChartArea}`} />
      </div>
    </div>
  );
}
