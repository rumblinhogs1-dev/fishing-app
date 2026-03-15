import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CanvasChart } from './CanvasChart';
import { drawDonut, drawHeatmap, drawBar, COLORS } from '../../utils/insightsCharts';
import styles from '../Insights.module.css';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function SpeciesTab({ data }) {
  const navigate = useNavigate();
  const donutData = data.topSpecies.slice(0, 10).map(([label, value]) => ({ label, value }));
  const [selectedSpecies, setSelectedSpecies] = useState('');

  // Heatmap rows (top 10 species)
  const heatmapRows = data.topSpecies.slice(0, 10).map(([species]) => ({
    label: species,
    data: data.speciesSeasonalHeatmap[species] || new Array(12).fill(0),
  }));

  // Species with size data (weight or length)
  const speciesWithSize = Object.entries(data.speciesSizeProgression)
    .filter(([, arr]) => arr.length >= 1)
    .sort((a, b) => b[1].length - a[1].length);

  const activeSpecies = selectedSpecies || (speciesWithSize[0]?.[0] || '');
  const sizeData = data.speciesSizeProgression[activeSpecies] || [];

  // Build bar chart for weight
  const weightEntries = sizeData.filter((p) => p.weight !== null);
  const weightBarData = weightEntries.map((p) => ({
    label: p.date.slice(5),
    value: p.weight,
  }));

  // Build bar chart for length
  const lengthEntries = sizeData.filter((p) => p.length !== null);
  const lengthBarData = lengthEntries.map((p) => ({
    label: p.date.slice(5),
    value: p.length,
  }));

  // Averages for the selected species
  const avgWeight = weightEntries.length
    ? Math.round(weightEntries.reduce((s, p) => s + p.weight, 0) / weightEntries.length * 10) / 10
    : null;
  const avgLength = lengthEntries.length
    ? Math.round(lengthEntries.reduce((s, p) => s + p.length, 0) / lengthEntries.length * 10) / 10
    : null;
  const maxWeight = weightEntries.length ? Math.max(...weightEntries.map((p) => p.weight)) : null;
  const maxLength = lengthEntries.length ? Math.max(...lengthEntries.map((p) => p.length)) : null;

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Species Distribution</h3>
      <div className={styles.donutWrap}>
        <CanvasChart drawFn={(ctx, d, w, h) => drawDonut(ctx, d, w, h)} data={donutData} w={360} h={300} />
      </div>

      <h4 className={styles.subHeading}>All Species</h4>
      <ul className={styles.rankedList}>
        {data.topSpecies.map(([species, count]) => (
          <li key={species} className={styles.rankedItem}>
            <span className={styles.rankedName}>{species}</span>
            <span className={styles.rankedBadge}>{count}</span>
          </li>
        ))}
      </ul>

      {/* Seasonal Heatmap */}
      {heatmapRows.length > 0 && (
        <>
          <h4 className={styles.subHeading}>Seasonal Activity by Species</h4>
          <p className={styles.chartDescription}>Number of catches per month for each species</p>
          <div className={styles.heatmapWrap}>
            <CanvasChart
              drawFn={(ctx, d, w, h) => drawHeatmap(ctx, d, MONTHS, w, h)}
              data={heatmapRows}
              w={600}
              h={Math.max(heatmapRows.length * 28 + 40, 120)}
            />
          </div>
        </>
      )}

      {/* Size Tracker */}
      {speciesWithSize.length > 0 && (
        <>
          <h4 className={styles.subHeading}>Size Tracker</h4>
          <p className={styles.chartDescription}>
            Track your catches over time for each species. Each bar is one catch.
          </p>
          <select
            className={styles.speciesSelect}
            value={activeSpecies}
            onChange={(e) => setSelectedSpecies(e.target.value)}
          >
            {speciesWithSize.map(([sp, arr]) => (
              <option key={sp} value={sp}>{sp} ({arr.length} catches)</option>
            ))}
          </select>

          {/* Stats summary cards */}
          <div className={styles.conditionsGrid}>
            {avgWeight !== null && (
              <div className={styles.conditionCard}>
                <span className={styles.conditionValue}>{avgWeight} lbs</span>
                <span className={styles.conditionLabel}>Avg Weight</span>
              </div>
            )}
            {maxWeight !== null && (
              <div
                className={`${styles.conditionCard} ${styles.recordCardClickable}`}
                onClick={() => {
                  const best = weightEntries.reduce((a, b) => (a.weight > b.weight ? a : b));
                  if (best.id) navigate(`/catch/${best.id}`);
                }}
              >
                <span className={styles.conditionValue}>{maxWeight} lbs</span>
                <span className={styles.conditionLabel}>Best Weight</span>
                <span className={styles.recordTap}>Tap to view</span>
              </div>
            )}
            {avgLength !== null && (
              <div className={styles.conditionCard}>
                <span className={styles.conditionValue}>{avgLength} in</span>
                <span className={styles.conditionLabel}>Avg Length</span>
              </div>
            )}
            {maxLength !== null && (
              <div
                className={`${styles.conditionCard} ${styles.recordCardClickable}`}
                onClick={() => {
                  const best = lengthEntries.reduce((a, b) => (a.length > b.length ? a : b));
                  if (best.id) navigate(`/catch/${best.id}`);
                }}
              >
                <span className={styles.conditionValue}>{maxLength} in</span>
                <span className={styles.conditionLabel}>Best Length</span>
                <span className={styles.recordTap}>Tap to view</span>
              </div>
            )}
            <div className={styles.conditionCard}>
              <span className={styles.conditionValue}>{sizeData.length}</span>
              <span className={styles.conditionLabel}>Total Caught</span>
            </div>
          </div>

          {/* Weight over time */}
          {weightBarData.length > 0 && (
            <>
              <h5 className={styles.detailSubHeading}>Weight by Catch (lbs)</h5>
              <CanvasChart
                drawFn={(ctx, d, w, h) => drawBar(ctx, d, w, h)}
                data={weightBarData}
                h={200}
              />
            </>
          )}

          {/* Length over time */}
          {lengthBarData.length > 0 && (
            <>
              <h5 className={styles.detailSubHeading}>Length by Catch (in)</h5>
              <CanvasChart
                drawFn={(ctx, d, w, h) => drawBar(ctx, d, w, h)}
                data={lengthBarData}
                h={200}
              />
            </>
          )}

          {weightBarData.length === 0 && lengthBarData.length === 0 && (
            <p className={styles.empty}>No weight or length data for this species yet.</p>
          )}
        </>
      )}
    </div>
  );
}
