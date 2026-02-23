import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import CatchCard from './CatchCard';
import QuickIdentify from './QuickIdentify';
import styles from './CatchList.module.css';

function StatsDashboard({ catches }) {
  const stats = useMemo(() => {
    if (!catches.length) return null;

    const total = catches.length;

    const withWeight = catches.filter((c) => c.weight);
    const biggest = withWeight.length
      ? withWeight.reduce((max, c) => (c.weight > max.weight ? c : max))
      : null;

    const speciesCount = {};
    catches.forEach((c) => {
      if (c.species) {
        const s = c.species.trim().toLowerCase();
        speciesCount[s] = (speciesCount[s] || 0) + 1;
      }
    });
    const topEntry = Object.entries(speciesCount).sort((a, b) => b[1] - a[1])[0];

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const thisMonth = catches.filter((c) => c.date && c.date >= monthStart).length;

    return { total, biggest, topSpecies: topEntry, thisMonth };
  }, [catches]);

  if (!stats) return null;

  return (
    <div className={styles.statsRow}>
      <div className={styles.statCard}>
        <span className={styles.statValue}>{stats.total}</span>
        <span className={styles.statLabel}>Total Catches</span>
      </div>
      {stats.biggest && (
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.biggest.weight} lbs</span>
          <span className={styles.statLabel}>Biggest — {stats.biggest.species}</span>
        </div>
      )}
      {stats.topSpecies && (
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ textTransform: 'capitalize' }}>
            {stats.topSpecies[0]}
          </span>
          <span className={styles.statLabel}>Top Species ({stats.topSpecies[1]})</span>
        </div>
      )}
      <div className={styles.statCard}>
        <span className={styles.statValue}>{stats.thisMonth}</span>
        <span className={styles.statLabel}>This Month</span>
      </div>
    </div>
  );
}

function exportCatchesCSV(catches) {
  const headers = [
    'Date', 'Time', 'Species', 'Weight (lbs)', 'Length (in)', 'Location',
    'Latitude', 'Longitude', 'Bait/Lure', 'Lure Name', 'Lure Type', 'Lure Color',
    'Weather', 'Water Temp (°F)', 'Flow Rate (ft³/s)', 'Depth (ft)',
    'Released', 'Visibility', 'Notes',
  ];

  const escapeCSV = (val) => {
    if (val == null || val === '') return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = catches.map((c) => {
    const d = c.date ? new Date(c.date) : null;
    return [
      d ? d.toLocaleDateString('en-US') : '',
      d ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '',
      c.species || '',
      c.weight || '',
      c.length || '',
      c.location || '',
      c.lat || '',
      c.lng || '',
      c.bait || '',
      c.lureName || '',
      c.lureType || '',
      c.lureColor || '',
      c.weather || '',
      c.waterTemp || '',
      c.flowRate || '',
      c.depth || '',
      c.released != null ? (c.released ? 'Yes' : 'No') : '',
      c.visibility || '',
      c.notes || '',
    ].map(escapeCSV).join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `my-catches-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function getDatePreset(preset) {
  const now = new Date();
  switch (preset) {
    case 'ytd': return new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
    case 'month': return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    case '30d': { const d = new Date(now); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); }
    case '90d': { const d = new Date(now); d.setDate(d.getDate() - 90); return d.toISOString().slice(0, 10); }
    case 'ly': return `${now.getFullYear() - 1}-01-01`;
    default: return '';
  }
}

function getDatePresetEnd(preset) {
  const now = new Date();
  if (preset === 'ly') return `${now.getFullYear() - 1}-12-31`;
  return '';
}

export default function CatchList({ catches, onDelete }) {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [datePreset, setDatePreset] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    if (preset === 'custom') return;
    setStartDate(getDatePreset(preset));
    setEndDate(getDatePresetEnd(preset));
  };

  const dateFiltered = useMemo(() => {
    if (datePreset === 'all' && !startDate && !endDate) return catches;
    return catches.filter((c) => {
      if (!c.date) return false;
      const d = c.date.slice(0, 10);
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });
  }, [catches, startDate, endDate, datePreset]);

  const filtered = useMemo(() => {
    if (!query.trim()) return dateFiltered;
    const q = query.toLowerCase();
    return dateFiltered.filter(
      (c) =>
        c.species?.toLowerCase().includes(q) ||
        c.location?.toLowerCase().includes(q)
    );
  }, [dateFiltered, query]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sortBy) {
      case 'size':
        return arr.sort((a, b) => (b.weight || 0) - (a.weight || 0));
      case 'species':
        return arr.sort((a, b) => (a.species || '').localeCompare(b.species || ''));
      case 'date':
      default:
        return arr.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
  }, [filtered, sortBy]);

  return (
    <div className={styles.container}>
      <QuickIdentify />

      <StatsDashboard catches={filtered} />

      <div className={styles.toolbar}>
        <h2 className={styles.heading}>My Catches</h2>
        <div className={styles.controls}>
          <input
            className={styles.search}
            type="text"
            placeholder="Filter by species or location..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className={styles.sortSelect}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Sort: Date</option>
            <option value="size">Sort: Size</option>
            <option value="species">Sort: Species</option>
          </select>
          {sorted.length > 0 && (
            <button
              className={styles.exportBtn}
              onClick={() => exportCatchesCSV(sorted)}
              title="Download as CSV for Excel / Google Sheets"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ verticalAlign: -2 }}>
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
              </svg>
              {' '}Export CSV
            </button>
          )}
        </div>
      </div>

      <div className={styles.dateFilter}>
        <div className={styles.presets}>
          {[
            ['all', 'All Time'],
            ['ytd', 'YTD'],
            ['month', 'This Month'],
            ['30d', 'Last 30 Days'],
            ['90d', 'Last 90 Days'],
            ['ly', 'Last Year'],
            ['custom', 'Custom'],
          ].map(([key, label]) => (
            <button
              key={key}
              className={`${styles.presetBtn} ${datePreset === key ? styles.presetActive : ''}`}
              onClick={() => handlePresetChange(key)}
            >
              {label}
            </button>
          ))}
        </div>
        {datePreset === 'custom' && (
          <div className={styles.dateInputs}>
            <label className={styles.dateLabel}>
              From
              <input type="date" className={styles.dateInput} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </label>
            <label className={styles.dateLabel}>
              To
              <input type="date" className={styles.dateInput} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </label>
          </div>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className={styles.empty}>
          <p>No catches yet!</p>
          <Link to="/add" className={styles.addLink}>Log your first catch</Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {sorted.map((c) => (
            <CatchCard key={c.id} entry={c} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
