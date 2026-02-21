import { useState } from 'react';
import { getLocalRecommendations } from '../utils/geminiLocal';
import { getGPSLocation, reverseGeocode } from '../utils/weather';
import { SkeletonCard } from './Skeleton';
import styles from './LocalGuide.module.css';

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'fishingGuides', label: 'Guides' },
  { key: 'hotels', label: 'Hotels' },
  { key: 'cabins', label: 'Cabins' },
  { key: 'camping', label: 'Camping' },
  { key: 'baitShops', label: 'Bait Shops' },
];

function CardMeta({ item, category }) {
  return (
    <div className={styles.cardMeta}>
      {item.priceRange && <span>{item.priceRange}</span>}
      {item.specialty && <span className={styles.cardTag}>{item.specialty}</span>}
      {item.distanceToWater && <span>{item.distanceToWater}</span>}
      {item.amenities && <span>{item.amenities}</span>}
      {item.features && <span>{item.features}</span>}
      {item.services && <span>{item.services}</span>}
      <span className={styles.cardTag}>{category}</span>
    </div>
  );
}

export default function LocalGuide() {
  const [location, setLocation] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  async function handleGPS() {
    setGpsLoading(true);
    try {
      const { lat, lng } = await getGPSLocation();
      const name = await reverseGeocode(lat, lng).catch(() => null);
      setLocation(name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } catch (err) {
      setError(err.message || 'Could not get location.');
    } finally {
      setGpsLoading(false);
    }
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!location.trim()) return;
    setLoading(true);
    setError('');
    setResults(null);
    try {
      const data = await getLocalRecommendations(location.trim());
      setResults(data);
      setActiveTab('all');
    } catch (err) {
      setError(err.message || 'Failed to get recommendations.');
    } finally {
      setLoading(false);
    }
  }

  function getFilteredItems() {
    if (!results) return [];
    if (activeTab === 'all') {
      const items = [];
      for (const cat of CATEGORIES.slice(1)) {
        const arr = results[cat.key];
        if (Array.isArray(arr)) {
          arr.forEach((item) => items.push({ ...item, _category: cat.label }));
        }
      }
      return items;
    }
    const arr = results[activeTab];
    const label = CATEGORIES.find((c) => c.key === activeTab)?.label || activeTab;
    return Array.isArray(arr) ? arr.map((item) => ({ ...item, _category: label })) : [];
  }

  const items = getFilteredItems();

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Local Guide</h2>

      <form onSubmit={handleSearch} className={styles.searchRow}>
        <input
          className={styles.searchInput}
          placeholder="Enter a location (e.g. Lake Fork, TX)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <button type="button" className={styles.gpsBtn} onClick={handleGPS} disabled={gpsLoading}>
          {gpsLoading ? 'Locating...' : 'GPS'}
        </button>
        <button type="submit" className={styles.searchBtn} disabled={loading || !location.trim()}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <p className={styles.error}>{error}</p>}

      {loading && (
        <>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </>
      )}

      {results && !loading && (
        <>
          {results.localTips && (
            <div className={styles.tips}>
              <h4 className={styles.tipsTitle}>Local Tips</h4>
              <p className={styles.tipsText}>{results.localTips}</p>
            </div>
          )}

          <div className={styles.tabs}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                className={`${styles.tab} ${activeTab === cat.key ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(cat.key)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {items.length === 0 && (
            <p className={styles.empty}>No recommendations found for this category.</p>
          )}

          {items.map((item, i) => (
            <div key={i} className={styles.card}>
              <h4 className={styles.cardName}>{item.name}</h4>
              <p className={styles.cardDesc}>{item.description}</p>
              <CardMeta item={item} category={item._category} />
            </div>
          ))}

          <p className={styles.disclaimer}>
            Results are AI-generated and may not reflect actual businesses. Always verify before visiting.
          </p>
        </>
      )}

      {!results && !loading && !error && (
        <p className={styles.empty}>Search for a location to find fishing guides, lodging, bait shops, and more nearby.</p>
      )}
    </div>
  );
}
