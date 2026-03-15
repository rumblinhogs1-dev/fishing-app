import { useState, useMemo, useEffect } from 'react';
import { computeInsightsData } from '../utils/insightsCompute';
import { SkeletonStats } from './Skeleton';
import UpgradePrompt from './UpgradePrompt';
import RecordsTab from './insights/RecordsTab';
import ConditionsTab from './insights/ConditionsTab';
import SpeciesTab from './insights/SpeciesTab';
import TrendsTab from './insights/TrendsTab';
import LuresTab from './insights/LuresTab';
import LocationsTab from './insights/LocationsTab';
import TimeTab from './insights/TimeTab';
import PatternsTab from './insights/PatternsTab';
import AICoachTab from './insights/AICoachTab';
import ConservationTab from './insights/ConservationTab';
import styles from './Insights.module.css';

const TABS = ['Records', 'Best Conditions', 'Species', 'Trends', 'Lures', 'Locations', 'Time of Day', 'Patterns', 'AI Coach', 'Conservation'];

export default function Insights({ catches }) {
  const [tab, setTab] = useState('Records');
  const [computing, setComputing] = useState(true);

  const data = useMemo(() => computeInsightsData(catches), [catches]);

  useEffect(() => {
    setComputing(false);
  }, [data]);

  if (computing) return <div className={styles.container}><h2 className={styles.heading}>Insights</h2><SkeletonStats /></div>;

  if (!data) {
    return (
      <div className={styles.container}>
        <h2 className={styles.heading}>Insights</h2>
        <p className={styles.empty}>No data yet. Start logging catches to see insights!</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Insights</h2>
      <UpgradePrompt feature="advancedStats" featureLabel="Advanced Insights">

      <div className={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t}
            className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Records' && <RecordsTab data={data} />}
      {tab === 'Best Conditions' && <ConditionsTab data={data} />}
      {tab === 'Species' && <SpeciesTab data={data} />}
      {tab === 'Trends' && <TrendsTab data={data} />}
      {tab === 'Lures' && <LuresTab data={data} />}
      {tab === 'Locations' && <LocationsTab data={data} />}
      {tab === 'Time of Day' && <TimeTab data={data} />}
      {tab === 'Patterns' && <PatternsTab catches={catches} />}
      {tab === 'AI Coach' && <AICoachTab catches={catches} />}
      {tab === 'Conservation' && <ConservationTab data={data} />}
      </UpgradePrompt>
    </div>
  );
}
