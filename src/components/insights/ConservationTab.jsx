import { CanvasChart } from './CanvasChart';
import { drawBar, drawDonut } from '../../utils/insightsCharts';
import styles from '../Insights.module.css';

export default function ConservationTab({ data }) {
  const cs = data.conservationStats;

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Conservation Stats</h3>
      <div className={styles.recordsGrid}>
        <div className={styles.recordCard} style={{ borderLeft: '3px solid #4caf50' }}>
          <span className={styles.recordValue} style={{ color: '#2e7d32' }}>{cs.totalReleased}</span>
          <span className={styles.recordLabel}>Total Released</span>
        </div>
        <div className={styles.recordCard} style={{ borderLeft: '3px solid #4caf50' }}>
          <span className={styles.recordValue} style={{ color: '#2e7d32' }}>{cs.yearReleased}</span>
          <span className={styles.recordLabel}>Released This Year</span>
        </div>
        <div className={styles.recordCard} style={{ borderLeft: '3px solid #4caf50' }}>
          <span className={styles.recordValue} style={{ color: '#2e7d32' }}>{cs.releaseRate}%</span>
          <span className={styles.recordLabel}>Release Rate</span>
        </div>
        <div className={styles.recordCard} style={{ borderLeft: '3px solid #4caf50' }}>
          <span className={styles.recordValue} style={{ color: '#2e7d32' }}>{cs.currentStreak}</span>
          <span className={styles.recordLabel}>Current Streak</span>
        </div>
      </div>

      {data.monthlyReleaseRate.length > 0 && (
        <>
          <h4 className={styles.subHeading}>Monthly Release Rate (%)</h4>
          <CanvasChart drawFn={(ctx, d, w, h) => drawBar(ctx, d, w, h)} data={data.monthlyReleaseRate} />
        </>
      )}

      {data.releasedSpeciesDonut.length > 0 && (
        <>
          <h4 className={styles.subHeading}>Released Species</h4>
          <div className={styles.donutWrap}>
            <CanvasChart drawFn={(ctx, d, w, h) => drawDonut(ctx, d, w, h)} data={data.releasedSpeciesDonut} w={360} h={300} />
          </div>
        </>
      )}

      {data.last30.length > 0 && (
        <>
          <h4 className={styles.subHeading}>Recent Catches (last 30)</h4>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {data.last30.map((released, i) => (
              <span
                key={i}
                title={released ? 'Released' : 'Kept / Unknown'}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: released ? '#4caf50' : '#ccc',
                  display: 'inline-block',
                  border: '2px solid #fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.75rem', color: '#888' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#4caf50', display: 'inline-block' }} /> Released
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ccc', display: 'inline-block' }} /> Kept / Unknown
            </span>
          </div>
        </>
      )}
    </div>
  );
}
