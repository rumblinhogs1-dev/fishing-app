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

export default function CatchList({ catches, onDelete }) {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');

  const filtered = useMemo(() => {
    if (!query.trim()) return catches;
    const q = query.toLowerCase();
    return catches.filter(
      (c) =>
        c.species?.toLowerCase().includes(q) ||
        c.location?.toLowerCase().includes(q)
    );
  }, [catches, query]);

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

      <StatsDashboard catches={catches} />

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
        </div>
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
