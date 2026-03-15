import { useState } from 'react';
import { CanvasChart } from './CanvasChart';
import { drawBar } from '../../utils/insightsCharts';
import styles from '../Insights.module.css';

export default function LocationsTab({ data }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Top Spots</h3>
      {data.topLocations.length === 0 ? (
        <p className={styles.empty}>No location data recorded yet.</p>
      ) : (
        <ul className={styles.rankedList}>
          {data.topLocations.map(([loc, count]) => {
            const isExpanded = expanded === loc;
            const speciesData = data.locationSpeciesCount[loc];
            const bestSeason = data.locationBestSeason[loc];
            const bestTime = data.locationBestTime[loc];
            const monthData = data.locationByMonth[loc];
            const monthBarData = monthData
              ? Object.entries(monthData)
                  .sort((a, b) => a[0].localeCompare(b[0]))
                  .map(([m, v]) => ({ label: m.slice(5), value: v }))
              : [];

            return (
              <li key={loc} className={`${styles.rankedItem} ${styles.rankedItemExpandable}`}>
                <div style={{ flex: 1 }}>
                  <div
                    className={styles.locationHeader}
                    onClick={() => setExpanded(isExpanded ? null : loc)}
                  >
                    <div>
                      <span className={styles.rankedName}>{loc}</span>
                      <div className={styles.locationMeta}>
                        {data.locationSpecies[loc] && (
                          <span>{data.locationSpecies[loc].size} species</span>
                        )}
                        {bestSeason && <span className={styles.lureTag}>{bestSeason}</span>}
                        {bestTime && <span className={styles.lureTag}>{bestTime}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={styles.rankedBadge}>{count}</span>
                      <span className={styles.expandArrow}>{isExpanded ? '\u25B2' : '\u25BC'}</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className={styles.locationDetail}>
                      {speciesData && (
                        <>
                          <h5 className={styles.detailSubHead}>Species Caught Here</h5>
                          <div className={styles.tagList}>
                            {Object.entries(speciesData)
                              .sort((a, b) => b[1] - a[1])
                              .map(([sp, c]) => (
                                <span key={sp} className={styles.seasonPill}>{sp}: {c}</span>
                              ))}
                          </div>
                        </>
                      )}
                      {monthBarData.length > 1 && (
                        <>
                          <h5 className={styles.detailSubHead}>Monthly Trend</h5>
                          <CanvasChart
                            drawFn={(ctx, d, w, h) => drawBar(ctx, d, w, h)}
                            data={monthBarData}
                            w={400}
                            h={160}
                          />
                        </>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
