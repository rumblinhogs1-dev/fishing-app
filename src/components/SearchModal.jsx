import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SearchModal.module.css';

export default function SearchModal({ catches, spots, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ catches: [], spots: [] });
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const search = useCallback((q) => {
    if (!q.trim()) {
      setResults({ catches: [], spots: [] });
      return;
    }
    const lower = q.toLowerCase();

    const matchedCatches = (catches || []).filter((c) =>
      (c.species && c.species.toLowerCase().includes(lower)) ||
      (c.location && c.location.toLowerCase().includes(lower)) ||
      (c.notes && c.notes.toLowerCase().includes(lower))
    ).slice(0, 8);

    const matchedSpots = (spots || []).filter((s) =>
      (s.name && s.name.toLowerCase().includes(lower)) ||
      (s.notes && s.notes.toLowerCase().includes(lower))
    ).slice(0, 5);

    setResults({ catches: matchedCatches, spots: matchedSpots });
  }, [catches, spots]);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 150);
    return () => clearTimeout(timer);
  }, [query, search]);

  function handleSelect(path) {
    onClose();
    navigate(path);
  }

  const hasResults = results.catches.length || results.spots.length;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.inputWrap}>
          <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
          <input
            ref={inputRef}
            className={styles.input}
            type="text"
            placeholder="Search catches, spots..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className={styles.kbd}>Esc</span>
        </div>

        <div className={styles.results}>
          {!query.trim() && (
            <p className={styles.hint}>Start typing to search across your data</p>
          )}

          {query.trim() && !hasResults && (
            <p className={styles.emptyResults}>No results for "{query}"</p>
          )}

          {results.catches.length > 0 && (
            <div className={styles.group}>
              <div className={styles.groupTitle}>Catches</div>
              {results.catches.map((c) => (
                <a key={c.id} className={styles.resultItem} onClick={() => handleSelect(`/catch/${c.id}`)}>
                  <span className={`${styles.resultIcon} ${styles.iconCatch}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                  </span>
                  <div className={styles.resultText}>
                    <div className={styles.resultTitle}>{c.species || 'Unknown'}</div>
                    <div className={styles.resultSub}>{[c.location, c.date?.slice(0, 10)].filter(Boolean).join(' - ')}</div>
                  </div>
                </a>
              ))}
            </div>
          )}

          {results.spots.length > 0 && (
            <div className={styles.group}>
              <div className={styles.groupTitle}>Spots</div>
              {results.spots.map((s) => (
                <a key={s.id} className={styles.resultItem} onClick={() => handleSelect('/spots')}>
                  <span className={`${styles.resultIcon} ${styles.iconSpot}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                  </span>
                  <div className={styles.resultText}>
                    <div className={styles.resultTitle}>{s.name}</div>
                    <div className={styles.resultSub}>{s.notes || 'Saved spot'}</div>
                  </div>
                </a>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
