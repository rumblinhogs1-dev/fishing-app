import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getLocalRecommendations } from '../utils/geminiLocal';
import { getPlacesRecommendations, hasPlacesApiKey } from '../utils/googlePlaces';
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

function StarRating({ rating, reviewCount }) {
  if (!rating) return null;
  const full = Math.floor(rating);
  const half = rating - full >= 0.25 && rating - full < 0.75;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className={styles.cardRating}>
      {'★'.repeat(full)}{half ? '½' : ''}{'☆'.repeat(empty)}{' '}
      {rating.toFixed(1)}
      {reviewCount != null && <span className={styles.reviewCount}>({reviewCount.toLocaleString()})</span>}
    </span>
  );
}

function CardMeta({ item, category }) {
  return (
    <div className={styles.cardMeta}>
      <StarRating rating={item.rating} reviewCount={item.reviewCount} />
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

async function fetchAllData(loc) {
  const usePlaces = hasPlacesApiKey();

  if (usePlaces) {
    const [placesResult, geminiResult] = await Promise.allSettled([
      getPlacesRecommendations(loc),
      getLocalRecommendations(loc),
    ]);

    const places = placesResult.status === 'fulfilled' ? placesResult.value : {};
    const gemini = geminiResult.status === 'fulfilled' ? geminiResult.value : {};

    return {
      fishingGuides: places.fishingGuides || [],
      hotels: places.hotels || [],
      cabins: places.cabins || [],
      camping: places.camping || [],
      baitShops: places.baitShops || [],
      localTips: gemini.localTips || '',
      regulationsUrl: gemini.regulationsUrl || '',
      licenseUrl: gemini.licenseUrl || '',
      _source: 'places',
      _placesError: placesResult.status === 'rejected' ? placesResult.reason?.message : '',
    };
  }

  // Fallback: Gemini-only (no Places API key)
  const gemini = await getLocalRecommendations(loc);
  return { ...gemini, _source: 'gemini' };
}

export default function LocalGuide() {
  const [searchParams] = useSearchParams();
  const [location, setLocation] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const autoSearched = useRef(false);

  useEffect(() => {
    const loc = searchParams.get('location');
    if (loc && !autoSearched.current) {
      autoSearched.current = true;
      setLocation(loc);
      setLoading(true);
      setError('');
      fetchAllData(loc)
        .then((data) => { setResults(data); setActiveTab('all'); })
        .catch((err) => setError(err.message || 'Failed to get recommendations.'))
        .finally(() => setLoading(false));
    }
  }, [searchParams]);

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
      const data = await fetchAllData(location.trim());
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
  const isPlacesSource = results?._source === 'places';

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
          {results._placesError && (
            <p className={styles.placesNote}>
              Google Places error: {results._placesError}. Business listings may be incomplete.
            </p>
          )}

          {!isPlacesSource && (
            <p className={styles.placesNote}>
              Add a Google Places API key for verified business listings. Currently using AI-generated suggestions.
            </p>
          )}

          {results.localTips && (
            <div className={styles.tips}>
              <h4 className={styles.tipsTitle}>Local Tips</h4>
              <p className={styles.tipsText}>{results.localTips}</p>
            </div>
          )}

          {(results.regulationsUrl || results.licenseUrl) && (
            <div className={styles.regsRow}>
              {results.regulationsUrl && (
                <a href={results.regulationsUrl} target="_blank" rel="noopener noreferrer" className={styles.regsLink}>
                  Fishing Regulations
                </a>
              )}
              {results.licenseUrl && (
                <a href={results.licenseUrl} target="_blank" rel="noopener noreferrer" className={styles.regsLink}>
                  Get a Fishing License
                </a>
              )}
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
              {item.address && item.address !== item.description && (
                <p className={styles.cardAddress}>{item.address}</p>
              )}
              <div className={styles.cardLinks}>
                {item.googleMapsUri ? (
                  <a
                    href={item.googleMapsUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.googleLink}
                  >
                    View on Google Maps
                  </a>
                ) : (
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(item.name + ' ' + location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.googleLink}
                  >
                    Search on Google
                  </a>
                )}
                {item.websiteUri && (
                  <a
                    href={item.websiteUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.cardWebsite}
                  >
                    Website
                  </a>
                )}
              </div>
              <CardMeta item={item} category={item._category} />
            </div>
          ))}

          <p className={styles.disclaimer}>
            {isPlacesSource
              ? 'Business listings from Google. Tips are AI-generated. Verify details before visiting.'
              : 'Results are AI-suggested and may not be accurate. Verify businesses before visiting.'}
          </p>
        </>
      )}

      {!results && !loading && !error && (
        <p className={styles.empty}>Search for a location to find fishing guides, lodging, bait shops, and more nearby.</p>
      )}
    </div>
  );
}
