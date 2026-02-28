import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useStockingData } from '../hooks/useStockingData';
import { getStateConfig } from '../config/stockingStates';
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

function WaterTimeline({ weeks, greyPast }) {
  const sorted = [...weeks].sort((a, b) => (a.weekStart || 0) - (b.weekStart || 0));
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return (
    <div className={styles.eventList}>
      {sorted.map((w, i) => {
        const current = isCurrentWeek(w.weekStart, w.weekEnd);
        const past = greyPast && w.weekEnd && w.weekEnd < today;

        return (
          <div
            key={i}
            className={`${styles.eventRow} ${current ? styles.eventCurrent : ''} ${past ? styles.eventPast : ''}`}
          >
            <div className={styles.eventDate}>{formatWeekLabel(w.weekStart, w.weekEnd)}</div>
            <SpeciesBadges species={w.species} />
          </div>
        );
      })}
    </div>
  );
}

function WaterRow({ waterBody, weeks, greyPast }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.waterRow}>
      <button className={styles.waterToggle} onClick={() => setOpen(!open)}>
        <span className={styles.waterName}>{waterBody}</span>
        <span className={styles.waterMeta}>
          <span className={styles.waterCount}>{weeks.length} stocking{weeks.length !== 1 ? 's' : ''}</span>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="currentColor"
            className={`${styles.waterChevron} ${open ? styles.waterChevronOpen : ''}`}
          >
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </span>
      </button>
      {open && <WaterTimeline weeks={weeks} greyPast={greyPast} />}
    </div>
  );
}

function RegionAccordion({ region, waters, defaultOpen, greyPast }) {
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
            <WaterRow key={waterBody} waterBody={waterBody} weeks={weeks} greyPast={greyPast} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function StockingSchedule() {
  const { state } = useParams();
  const config = getStateConfig(state);
  const { data, loading, error } = useStockingData(config);
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');

  // Build grouped data
  const waterMap = useMemo(() => buildTimeline(data), [data]);

  // Only grey out past blocks when there's current/future data to contrast with
  const greyPast = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return data.some((e) => e.weekEnd && e.weekEnd >= today);
  }, [data]);

  // Get unique regions
  const regions = useMemo(() => {
    const set = new Set();
    data.forEach((e) => { if (e.region) set.add(e.region); });
    return Array.from(set).sort();
  }, [data]);

  // Filter and trim past entries to 10 most recent per water body
  const filtered = useMemo(() => {
    const result = new Map();
    const needle = search.toLowerCase().trim();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    waterMap.forEach(({ waterBody, region, weeks }) => {
      if (regionFilter && region !== regionFilter) return;
      if (needle && !waterBody.toLowerCase().includes(needle)) return;

      const future = weeks.filter((w) => !w.weekEnd || w.weekEnd >= today);
      const past = weeks
        .filter((w) => w.weekEnd && w.weekEnd < today)
        .sort((a, b) => (b.weekStart || 0) - (a.weekStart || 0))
        .slice(0, 10);
      const trimmed = [...past, ...future];

      if (!result.has(region)) result.set(region, []);
      result.get(region).push({ waterBody, weeks: trimmed });
    });

    // Sort waters within each region
    result.forEach((waters) => waters.sort((a, b) => a.waterBody.localeCompare(b.waterBody)));
    return result;
  }, [waterMap, search, regionFilter]);

  if (!config) {
    return (
      <div className={styles.container}>
        <h1 className={styles.heading}>State Not Found</h1>
        <div className={styles.error}>
          <p>No stocking data available for &ldquo;{state}&rdquo;. Check back later as we add more states.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <h1 className={styles.heading}>{config.name} Fish Stocking Schedule</h1>
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
        <h1 className={styles.heading}>{config.name} Fish Stocking Schedule</h1>
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
      <h1 className={styles.heading}>{config.name} Fish Stocking Schedule</h1>
      <p className={styles.subtitle}>{config.subtitle}</p>

      <div className={styles.disclaimer}>
        <strong>Note:</strong> {config.disclaimer}
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
              greyPast={greyPast}
            />
          ))
      )}

      <a
        className={styles.footerLink}
        href={config.agencyUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        View official {config.agency} stocking page &rarr;
      </a>

      <div className={styles.bottomDisclaimer}>
        {config.bottomDisclaimer}
      </div>
    </div>
  );
}
