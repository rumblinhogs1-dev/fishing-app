import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import CatchCard from './CatchCard';
import QuickIdentify from './QuickIdentify';
import styles from './CatchList.module.css';

export default function CatchList({ catches, onDelete }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return catches;
    const q = query.toLowerCase();
    return catches.filter(
      (c) =>
        c.species?.toLowerCase().includes(q) ||
        c.location?.toLowerCase().includes(q)
    );
  }, [catches, query]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [filtered]
  );

  return (
    <div className={styles.container}>
      <QuickIdentify />

      <div className={styles.toolbar}>
        <h2 className={styles.heading}>My Catches</h2>
        <input
          className={styles.search}
          type="text"
          placeholder="Filter by species or location..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
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
