import { CanvasChart } from './CanvasChart';
import { drawBar, drawLine, COLORS } from '../../utils/insightsCharts';
import styles from '../Insights.module.css';

export default function TrendsTab({ data }) {
  const barData = data.months.map(([m, v]) => ({ label: m.slice(5), value: v }));

  const yoyDatasets = data.years.map((year) => ({
    label: year,
    points: Array.from({ length: 12 }, (_, i) => {
      const month = String(i + 1).padStart(2, '0');
      return { label: month, value: data.yearMonth[year]?.[month] || 0 };
    }),
  }));

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Monthly Catch Count</h3>
      <CanvasChart drawFn={(ctx, d, w, h) => drawBar(ctx, d, w, h)} data={barData} />

      {data.years.length > 1 && (
        <>
          <h4 className={styles.subHeading}>Year-over-Year Comparison</h4>
          <CanvasChart drawFn={(ctx, d, w, h) => drawLine(ctx, d, w, h)} data={yoyDatasets} />
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {data.years.map((y, i) => (
              <span key={y} style={{ fontSize: '0.8rem', color: COLORS[i % COLORS.length], fontWeight: 600 }}>
                {y}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
