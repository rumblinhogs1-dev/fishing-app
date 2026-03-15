import { CanvasChart } from './CanvasChart';
import { drawBar } from '../../utils/insightsCharts';
import styles from '../Insights.module.css';

export default function LuresTab({ data }) {
  const barData = data.topLures.slice(0, 8).map(([label, value]) => ({
    label: label.length > 10 ? label.slice(0, 9) + '..' : label,
    value,
  }));

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Top Lures / Baits</h3>
      {data.topLures.length === 0 ? (
        <p className={styles.empty}>No lure/bait data recorded yet.</p>
      ) : (
        <>
          <CanvasChart drawFn={(ctx, d, w, h) => drawBar(ctx, d, w, h)} data={barData} />

          <h4 className={styles.subHeading}>Lure Effectiveness</h4>
          <ul className={styles.rankedList}>
            {data.topLures.map(([lure, count]) => {
              const best = data.lureBestFor[lure];
              const seasonData = data.lureBySeason[lure];
              return (
                <li key={lure} className={styles.rankedItem}>
                  <div>
                    <span className={styles.rankedName}>{lure}</span>
                    {data.lureBySpecies[lure] && (
                      <div className={styles.lureSpeciesLine}>
                        {Object.entries(data.lureBySpecies[lure]).slice(0, 3).map(([sp, c]) => `${sp} (${c})`).join(', ')}
                      </div>
                    )}
                    {best && (
                      <div className={styles.lureSummary}>
                        {best.species && <span className={styles.lureTag}>Best: {best.species}</span>}
                        {best.season && <span className={styles.lureTag}>{best.season}</span>}
                        {best.tempRange && <span className={styles.lureTag}>{best.tempRange}</span>}
                      </div>
                    )}
                    {seasonData && (
                      <div className={styles.lureSeasons}>
                        {Object.entries(seasonData).filter(([, v]) => v > 0).map(([season, v]) => (
                          <span key={season} className={styles.seasonPill}>{season}: {v}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className={styles.rankedBadge}>{count}</span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
