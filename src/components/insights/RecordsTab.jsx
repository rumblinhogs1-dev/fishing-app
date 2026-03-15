import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CanvasChart } from './CanvasChart';
import { drawLine } from '../../utils/insightsCharts';
import styles from '../Insights.module.css';

export default function RecordsTab({ data }) {
  const navigate = useNavigate();
  const [showAllPBs, setShowAllPBs] = useState(false);

  const speciesPBList = Object.entries(data.speciesPBs)
    .filter(([, pb]) => pb.heaviest || pb.longest)
    .sort((a, b) => b[1].count - a[1].count);
  const displayPBs = showAllPBs ? speciesPBList : speciesPBList.slice(0, 5);

  const pbLineData = data.pbTimeline.length > 1 ? [{
    label: 'PB Weight',
    points: data.pbTimeline.map((p) => ({ label: p.date.slice(5), value: p.weight })),
  }] : [];

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Personal Bests</h3>
      <div className={styles.recordsGrid}>
        {data.mostRecent ? (
          <div
            className={`${styles.recordCard} ${styles.recordCardClickable}`}
            onClick={() => navigate(`/catch/${data.mostRecent.id}`)}
          >
            <span className={styles.recordValue}>{data.total}</span>
            <span className={styles.recordLabel}>Total Catches</span>
            <span className={styles.recordTap}>View latest</span>
          </div>
        ) : (
          <div className={styles.recordCard}>
            <span className={styles.recordValue}>{data.total}</span>
            <span className={styles.recordLabel}>Total Catches</span>
          </div>
        )}
        {data.heaviest && (
          <div
            className={`${styles.recordCard} ${styles.recordCardClickable}`}
            onClick={() => navigate(`/catch/${data.heaviest.id}`)}
          >
            {(data.heaviest.imageUrl || data.heaviest.image) && (
              <img src={data.heaviest.imageUrl || data.heaviest.image} alt={data.heaviest.species} className={styles.recordThumb} />
            )}
            <span className={styles.recordValue}>{data.heaviest.weight} lbs</span>
            <span className={styles.recordLabel}>Heaviest Catch</span>
            <span className={styles.recordSub}>{data.heaviest.species}</span>
            <span className={styles.recordTap}>Tap to view</span>
          </div>
        )}
        {data.longest && (
          <div
            className={`${styles.recordCard} ${styles.recordCardClickable}`}
            onClick={() => navigate(`/catch/${data.longest.id}`)}
          >
            {(data.longest.imageUrl || data.longest.image) && (
              <img src={data.longest.imageUrl || data.longest.image} alt={data.longest.species} className={styles.recordThumb} />
            )}
            <span className={styles.recordValue}>{data.longest.length} in</span>
            <span className={styles.recordLabel}>Longest Catch</span>
            <span className={styles.recordSub}>{data.longest.species}</span>
            <span className={styles.recordTap}>Tap to view</span>
          </div>
        )}
        {data.bestDay && (
          <div
            className={`${styles.recordCard} ${data.bestDayCatches.length ? styles.recordCardClickable : ''}`}
            onClick={() => data.bestDayCatches.length && navigate(`/catch/${data.bestDayCatches[0].id}`)}
          >
            <span className={styles.recordValue}>{data.bestDay[1]}</span>
            <span className={styles.recordLabel}>Most in a Day</span>
            <span className={styles.recordSub}>{data.bestDay[0]}</span>
            {data.bestDayCatches.length > 0 && <span className={styles.recordTap}>Tap to view</span>}
          </div>
        )}
        <div className={styles.recordCard}>
          <span className={styles.recordValue}>{data.topSpecies.length}</span>
          <span className={styles.recordLabel}>Unique Species</span>
        </div>
        <div className={styles.recordCard}>
          <span className={styles.recordValue}>{data.topLocations.length}</span>
          <span className={styles.recordLabel}>Spots Fished</span>
        </div>
      </div>

      {/* Streaks */}
      <h4 className={styles.subHeading}>Streaks</h4>
      <div className={styles.recordsGrid}>
        <div className={styles.recordCard} style={{ borderLeft: '3px solid #ff9800' }}>
          <span className={styles.recordValue}>{data.currentStreak}</span>
          <span className={styles.recordLabel}>Current Streak (days)</span>
        </div>
        <div className={styles.recordCard} style={{ borderLeft: '3px solid #ff9800' }}>
          <span className={styles.recordValue}>{data.longestStreak}</span>
          <span className={styles.recordLabel}>Longest Streak (days)</span>
        </div>
      </div>

      {/* Species PBs */}
      {speciesPBList.length > 0 && (
        <>
          <h4 className={styles.subHeading}>Species Personal Bests</h4>
          <ul className={styles.rankedList}>
            {displayPBs.map(([species, pb]) => (
              <li key={species} className={styles.rankedItem}>
                <div>
                  <span className={styles.rankedName}>{species}</span>
                  <div className={styles.pbDetails}>
                    {pb.heaviest && (
                      <span
                        className={styles.pbLink}
                        onClick={() => navigate(`/catch/${pb.heaviest.id}`)}
                      >
                        {pb.heaviest.weight} lbs
                      </span>
                    )}
                    {pb.longest && (
                      <span
                        className={styles.pbLink}
                        onClick={() => navigate(`/catch/${pb.longest.id}`)}
                      >
                        {pb.longest.length} in
                      </span>
                    )}
                  </div>
                </div>
                <span className={styles.rankedBadge}>{pb.count}</span>
              </li>
            ))}
          </ul>
          {speciesPBList.length > 5 && (
            <button className={styles.showMoreBtn} onClick={() => setShowAllPBs(!showAllPBs)}>
              {showAllPBs ? 'Show less' : `Show all ${speciesPBList.length} species`}
            </button>
          )}
        </>
      )}

      {/* PB Timeline */}
      {pbLineData.length > 0 && (
        <>
          <h4 className={styles.subHeading}>PB Weight Timeline</h4>
          <CanvasChart drawFn={(ctx, d, w, h) => drawLine(ctx, d, w, h)} data={pbLineData} />
        </>
      )}
    </div>
  );
}
