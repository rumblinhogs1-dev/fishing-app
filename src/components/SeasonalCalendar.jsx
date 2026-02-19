import styles from './SeasonalCalendar.module.css';

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getBarColor(quality) {
  if (quality <= 3) return '#e65100';
  if (quality <= 5) return '#f9a825';
  if (quality <= 7) return '#66bb6a';
  return '#2e7d32';
}

export default function SeasonalCalendar({ data }) {
  if (!data?.months?.length) return null;

  const currentMonth = new Date().getMonth(); // 0-based

  return (
    <div>
      <div className={styles.barChart}>
        {data.months.map((m, i) => {
          const quality = Math.max(1, Math.min(10, m.quality || 1));
          const heightPct = (quality / 10) * 100;
          const isCurrent = i === currentMonth;
          return (
            <div key={i} className={styles.barCol}>
              <div
                className={`${styles.bar} ${isCurrent ? styles.barCurrent : ''}`}
                style={{ height: `${heightPct}%`, background: getBarColor(quality) }}
                title={`${m.month}: ${quality}/10${m.notes ? ' — ' + m.notes : ''}`}
              />
              <span className={styles.barLabel}>{MONTH_ABBR[i]}</span>
              {isCurrent && <span className={styles.currentDot} />}
            </div>
          );
        })}
      </div>

      <div className={styles.calendarMeta}>
        {data.bestMonth && <span className={styles.calendarBest}>Best: {data.bestMonth}</span>}
        {data.worstMonth && <span className={styles.calendarWorst}>Worst: {data.worstMonth}</span>}
      </div>

      {data.summary && <p className={styles.calendarSummary}>{data.summary}</p>}
    </div>
  );
}
