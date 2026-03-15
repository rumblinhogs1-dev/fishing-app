import { CanvasChart } from './CanvasChart';
import { drawBar } from '../../utils/insightsCharts';
import styles from '../Insights.module.css';

export default function TimeTab({ data }) {
  const barData = data.hourCounts.map((count, h) => {
    const label = h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`;
    return { label, value: count };
  });

  const nonZero = barData.filter((d) => d.value > 0);
  const bestHour = nonZero.length ? nonZero.reduce((a, b) => (a.value > b.value ? a : b)) : null;

  const slots = [
    { label: 'Dawn (5-8a)', start: 5, end: 8 },
    { label: 'Morning (8-11a)', start: 8, end: 11 },
    { label: 'Midday (11a-2p)', start: 11, end: 14 },
    { label: 'Afternoon (2-5p)', start: 14, end: 17 },
    { label: 'Evening (5-8p)', start: 17, end: 20 },
    { label: 'Night (8p-5a)', start: 20, end: 5 },
  ];

  const slotCounts = slots.map((slot) => {
    let total = 0;
    if (slot.start < slot.end) {
      for (let h = slot.start; h < slot.end; h++) total += data.hourCounts[h];
    } else {
      for (let h = slot.start; h < 24; h++) total += data.hourCounts[h];
      for (let h = 0; h < slot.end; h++) total += data.hourCounts[h];
    }
    return { label: slot.label, value: total };
  });

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Catches by Hour</h3>
      <CanvasChart drawFn={(ctx, d, w, h) => drawBar(ctx, d, w, h)} data={barData} />

      {bestHour && (
        <div className={styles.conditionsGrid} style={{ marginTop: '1rem' }}>
          <div className={styles.conditionCard}>
            <span className={styles.conditionValue}>{bestHour.label}</span>
            <span className={styles.conditionLabel}>Peak Hour ({bestHour.value} catches)</span>
          </div>
        </div>
      )}

      <h4 className={styles.subHeading}>Best Time Slots</h4>
      <CanvasChart drawFn={(ctx, d, w, h) => drawBar(ctx, d, w, h)} data={slotCounts} h={200} />
    </div>
  );
}
