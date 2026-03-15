import { CanvasChart } from './CanvasChart';
import { drawBar, drawDonut } from '../../utils/insightsCharts';
import styles from '../Insights.module.css';

export default function ConditionsTab({ data }) {
  const bestSeason = Object.entries(data.seasonCount).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Best Conditions for Catching</h3>

      {/* Best ranges */}
      <div className={styles.conditionsGrid}>
        {data.bestTempRange && (
          <div className={styles.conditionCard}>
            <span className={styles.conditionValue}>{data.bestTempRange}</span>
            <span className={styles.conditionLabel}>Best Temp Range</span>
          </div>
        )}
        {data.bestPressureRange && (
          <div className={styles.conditionCard}>
            <span className={styles.conditionValue}>{data.bestPressureRange}</span>
            <span className={styles.conditionLabel}>Best Pressure Range</span>
          </div>
        )}
        {data.bestWindRange && (
          <div className={styles.conditionCard}>
            <span className={styles.conditionValue}>{data.bestWindRange}</span>
            <span className={styles.conditionLabel}>Best Wind Range</span>
          </div>
        )}
        {data.bestMoonPhase && (
          <div className={styles.conditionCard}>
            <span className={styles.conditionValue}>{data.bestMoonPhase}</span>
            <span className={styles.conditionLabel}>Best Moon Phase</span>
          </div>
        )}
        {bestSeason && (
          <div className={styles.conditionCard}>
            <span className={styles.conditionValue}>{bestSeason[0]}</span>
            <span className={styles.conditionLabel}>Best Season ({bestSeason[1]} catches)</span>
          </div>
        )}
        {data.avgTemp !== null && (
          <div className={styles.conditionCard}>
            <span className={styles.conditionValue}>{data.avgTemp}°F</span>
            <span className={styles.conditionLabel}>Avg Weather Temp</span>
          </div>
        )}
      </div>

      {/* Temperature distribution */}
      {data.tempBucketData.length > 0 && (
        <>
          <h4 className={styles.subHeading}>Catches by Temperature</h4>
          <CanvasChart drawFn={(ctx, d, w, h) => drawBar(ctx, d, w, h)} data={data.tempBucketData} h={200} />
        </>
      )}

      {/* Pressure distribution */}
      {data.pressureBucketData.length > 0 && (
        <>
          <h4 className={styles.subHeading}>Catches by Pressure</h4>
          <CanvasChart drawFn={(ctx, d, w, h) => drawBar(ctx, d, w, h)} data={data.pressureBucketData} h={200} />
        </>
      )}

      {/* Wind distribution */}
      {data.windBuckets.length > 0 && (
        <>
          <h4 className={styles.subHeading}>Catches by Wind Speed</h4>
          <CanvasChart drawFn={(ctx, d, w, h) => drawBar(ctx, d, w, h)} data={data.windBuckets} h={200} />
        </>
      )}

      {/* Moon phase */}
      {data.moonPhaseData.length > 0 && (
        <>
          <h4 className={styles.subHeading}>Catches by Moon Phase</h4>
          <div className={styles.donutWrap}>
            <CanvasChart drawFn={(ctx, d, w, h) => drawDonut(ctx, d, w, h)} data={data.moonPhaseData} w={360} h={300} />
          </div>
        </>
      )}

      {/* Cloud cover */}
      {data.cloudBucketData.length > 0 && (
        <>
          <h4 className={styles.subHeading}>Catches by Cloud Cover</h4>
          <CanvasChart drawFn={(ctx, d, w, h) => drawBar(ctx, d, w, h)} data={data.cloudBucketData} h={200} />
        </>
      )}

      {/* Season */}
      <h4 className={styles.subHeading}>Catches by Season</h4>
      <CanvasChart
        drawFn={(ctx, d, w, h) => drawBar(ctx, d, w, h)}
        data={Object.entries(data.seasonCount).map(([label, value]) => ({ label, value }))}
        h={200}
      />
    </div>
  );
}
