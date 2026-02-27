import { useState, useMemo } from 'react';
import { useStockingData } from '../hooks/useStockingData';
import { getCurrentWeekStocking } from '../utils/stockingData';
import styles from './StockingSchedule.module.css';

function SpeciesBadges({ species }) {
  return (
    <div className={styles.weekCardSpecies}>
      {species.map((s) => (
        <span
          key={s}
          className={`${styles.speciesBadge} ${
            s.toLowerCase().includes('trout') ? styles.speciesTrout : styles.speciesCatfish
          }`}
        >
          {s}
        </span>
      ))}
    </div>
  );
}

function ThisWeekSection({ entries }) {
  const current = useMemo(() => getCurrentWeekStocking(entries), [entries]);

  // Deduplicate by waterBody — merge species
  const merged = useMemo(() => {
    const map = new Map();
    current.forEach((e) => {
      const key = e.waterBody;
      if (!map.has(key)) {
        map.set(key, { ...e, species: [...e.species] });
      } else {
        const existing = map.get(key);
        e.species.forEach((s) => {
          if (!existing.species.includes(s)) existing.species.push(s);
        });
      }
    });
    return Array.from(map.values());
  }, [current]);

  return (
    <div className={styles.weekSection}>
      <h2 className={styles.weekHeading}>
        <span className={styles.weekDot} />
        Stocked This Week
      </h2>
      {merged.length === 0 ? (
        <div className={styles.emptyWeek}>
          No waters scheduled for stocking this week. Check back soon!
        </div>
      ) : (
        <div className={styles.weekCards}>
          {merged.map((e) => (
            <div key={e.waterBody} className={styles.weekCard}>
              <div className={styles.weekCardWater}>{e.waterBody}</div>
              <SpeciesBadges species={e.species} />
              {e.region && <div className={styles.weekCardRegion}>{e.region}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function buildTimeline(entries) {
  // Group entries by waterBody+region, build week blocks
  const waterMap = new Map();
  entries.forEach((e) => {
    const key = `${e.region}|||${e.waterBody}`;
    if (!waterMap.has(key)) {
      waterMap.set(key, { waterBody: e.waterBody, region: e.region, weeks: [] });
    }
    waterMap.get(key).weeks.push(e);
  });
  return waterMap;
}

function isCurrentWeek(weekStart, weekEnd) {
  if (!weekStart || !weekEnd) return false;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return weekStart <= today && weekEnd >= today;
}

function formatWeekLabel(weekStart, weekEnd) {
  if (!weekStart) return '';
  const opts = { month: 'short', day: 'numeric' };
  const s = weekStart.toLocaleDateString('en-US', opts);
  const e = weekEnd ? weekEnd.toLocaleDateString('en-US', opts) : '';
  return e ? `${s} – ${e}` : s;
}

function WaterTimeline({ weeks }) {
  // Sort by weekStart
  const sorted = [...weeks].sort((a, b) => (a.weekStart || 0) - (b.weekStart || 0));

  return (
    <div className={styles.timeline}>
      {sorted.map((w, i) => {
        const hasTrout = w.species.some((s) => s.toLowerCase().includes('trout'));
        const hasCatfish = w.species.some((s) => s.toLowerCase().includes('catfish'));
        const current = isCurrentWeek(w.weekStart, w.weekEnd);

        let blockClass = styles.blockEmpty;
        if (hasTrout && hasCatfish) blockClass = styles.blockBoth;
        else if (hasTrout) blockClass = styles.blockTrout;
        else if (hasCatfish) blockClass = styles.blockCatfish;

        const label = formatWeekLabel(w.weekStart, w.weekEnd);
        const speciesLabel = w.species.join(', ');

        return (
          <div
            key={i}
            className={`${styles.timeBlock} ${blockClass} ${current ? styles.blockCurrent : ''}`}
            title={`${label}\n${speciesLabel}`}
          >
            {hasTrout && hasCatfish ? 'B' : hasTrout ? 'T' : hasCatfish ? 'C' : ''}
          </div>
        );
      })}
    </div>
  );
}

function RegionAccordion({ region, waters, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={styles.regionGroup}>
      <button className={styles.regionHeader} onClick={() => setOpen(!open)}>
        <span>
          {region || 'Other'}
          <span className={styles.regionCount}>({waters.length})</span>
        </span>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="currentColor"
          className={`${styles.regionChevron} ${open ? styles.regionChevronOpen : ''}`}
        >
          <path d="M7 10l5 5 5-5z" />
        </svg>
      </button>
      {open && (
        <div className={styles.waterList}>
          {waters.map(({ waterBody, weeks }) => (
            <div key={waterBody} className={styles.waterRow}>
              <div className={styles.waterName}>{waterBody}</div>
              <WaterTimeline weeks={weeks} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StockingSchedule() {
  const { data, loading, error } = useStockingData();
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');

  // Build grouped data
  const waterMap = useMemo(() => buildTimeline(data), [data]);

  // Get unique regions
  const regions = useMemo(() => {
    const set = new Set();
    data.forEach((e) => { if (e.region) set.add(e.region); });
    return Array.from(set).sort();
  }, [data]);

  // Filter
  const filtered = useMemo(() => {
    const result = new Map();
    const needle = search.toLowerCase().trim();

    waterMap.forEach(({ waterBody, region, weeks }) => {
      if (regionFilter && region !== regionFilter) return;
      if (needle && !waterBody.toLowerCase().includes(needle)) return;

      if (!result.has(region)) result.set(region, []);
      result.get(region).push({ waterBody, weeks });
    });

    // Sort waters within each region
    result.forEach((waters) => waters.sort((a, b) => a.waterBody.localeCompare(b.waterBody)));
    return result;
  }, [waterMap, search, regionFilter]);

  if (loading) {
    return (
      <div className={styles.container}>
        <h1 className={styles.heading}>AZ Fish Stocking Schedule</h1>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <div>Loading stocking schedules...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h1 className={styles.heading}>AZ Fish Stocking Schedule</h1>
        <div className={styles.error}>
          <p>{error}</p>
          <button className={styles.retryBtn} onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>AZ Fish Stocking Schedule</h1>
      <p className={styles.subtitle}>
        AZGFD stocking schedules for community fishing waters, winter, and spring/summer programs.
      </p>

      <div className={styles.disclaimer}>
        <strong>Note:</strong> Stocking schedules are tentative and subject to change due to weather,
        fish availability, and water conditions. Always verify with AZGFD before planning a trip.
      </div>

      <ThisWeekSection entries={data} />

      <div className={styles.filters}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search water body..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={styles.regionSelect}
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
        >
          <option value="">All Regions</option>
          {regions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* Timeline legend */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', fontSize: '0.75rem', color: '#666', flexWrap: 'wrap' }}>
        <span><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 2, background: '#1565c0', verticalAlign: 'middle', marginRight: 4 }} /> Trout</span>
        <span><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 2, background: '#7b1fa2', verticalAlign: 'middle', marginRight: 4 }} /> Catfish</span>
        <span><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 2, background: 'linear-gradient(135deg, #1565c0 50%, #7b1fa2 50%)', verticalAlign: 'middle', marginRight: 4 }} /> Both</span>
        <span><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 2, border: '2px solid #43a047', verticalAlign: 'middle', marginRight: 4 }} /> Current Week</span>
      </div>

      {filtered.size === 0 ? (
        <div className={styles.emptyWeek}>
          No waters match your search. Try a different name or region.
        </div>
      ) : (
        Array.from(filtered.entries())
          .sort(([a], [b]) => (a || '').localeCompare(b || ''))
          .map(([region, waters], idx) => (
            <RegionAccordion
              key={region || 'other'}
              region={region}
              waters={waters}
              defaultOpen={idx === 0}
            />
          ))
      )}

      <a
        className={styles.footerLink}
        href="https://www.azgfd.com/fishing/stocking/"
        target="_blank"
        rel="noopener noreferrer"
      >
        View official AZGFD stocking page &rarr;
      </a>

      <div className={styles.bottomDisclaimer}>
        Data sourced from publicly available AZGFD stocking schedules.
        MyCatchBook is not affiliated with Arizona Game & Fish Department.
      </div>
    </div>
  );
}
