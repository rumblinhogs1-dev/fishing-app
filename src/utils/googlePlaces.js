const PLACES_KEY_STORAGE = 'fishing-app-places-api-key';
const PLACES_CACHE_KEY = 'fishing-app-places-cache-v1';
const CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours
const MAX_CACHE_ENTRIES = 30;
const PLACES_URL = 'https://places.googleapis.com/v1/places:searchText';

const FIELD_MASK = [
  'places.displayName',
  'places.formattedAddress',
  'places.rating',
  'places.userRatingCount',
  'places.priceLevel',
  'places.websiteUri',
  'places.googleMapsUri',
  'places.editorialSummary',
].join(',');

const CATEGORY_QUERIES = {
  fishingGuides: 'fishing guide OR fishing charter near',
  hotels: 'hotel OR motel near',
  cabins: 'cabin rental OR fishing lodge near',
  camping: 'campground OR RV park near',
  baitShops: 'bait shop OR tackle shop near',
};

export function getPlacesApiKey() {
  const envKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
  if (envKey) return envKey;
  return localStorage.getItem(PLACES_KEY_STORAGE) || '';
}

export function hasPlacesApiKey() {
  return !!getPlacesApiKey();
}

function getCacheKey(location) {
  return (location || '').toLowerCase().trim();
}

function getCache(key) {
  try {
    const raw = localStorage.getItem(PLACES_CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw);
    const entry = cache[key];
    if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
    delete cache[key];
    localStorage.setItem(PLACES_CACHE_KEY, JSON.stringify(cache));
  } catch { /* ignore */ }
  return null;
}

function setCache(key, data) {
  try {
    const raw = localStorage.getItem(PLACES_CACHE_KEY);
    const cache = raw ? JSON.parse(raw) : {};
    const keys = Object.keys(cache);
    if (keys.length >= MAX_CACHE_ENTRIES) {
      let oldest = keys[0];
      for (const k of keys) {
        if (cache[k].ts < cache[oldest].ts) oldest = k;
      }
      delete cache[oldest];
    }
    cache[key] = { data, ts: Date.now() };
    localStorage.setItem(PLACES_CACHE_KEY, JSON.stringify(cache));
  } catch { /* ignore */ }
}

function normalizePriceLevel(priceLevel) {
  const map = {
    PRICE_LEVEL_FREE: 'Free',
    PRICE_LEVEL_INEXPENSIVE: '$',
    PRICE_LEVEL_MODERATE: '$$',
    PRICE_LEVEL_EXPENSIVE: '$$$',
    PRICE_LEVEL_VERY_EXPENSIVE: '$$$$',
  };
  return map[priceLevel] || '';
}

function normalizePlace(place) {
  return {
    name: place.displayName?.text || 'Unknown',
    description: place.editorialSummary?.text || place.formattedAddress || '',
    address: place.formattedAddress || '',
    rating: place.rating || null,
    reviewCount: place.userRatingCount || null,
    priceRange: normalizePriceLevel(place.priceLevel),
    googleMapsUri: place.googleMapsUri || '',
    websiteUri: place.websiteUri || '',
  };
}

async function searchCategory(query, location, apiKey) {
  const res = await fetch(PLACES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: `${query} ${location}`,
      maxResultCount: 5,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    const msg = errData?.error?.message || '';
    if (res.status === 401 || res.status === 403) throw new Error('Invalid or unauthorized Google Places API key.');
    if (res.status === 429) throw new Error('Google Places API rate limit reached. Please try again later.');
    throw new Error(msg || `Places API request failed (${res.status}).`);
  }

  const data = await res.json();
  return (data.places || []).map(normalizePlace);
}

/**
 * Fetch real business listings from Google Places API for a location.
 * Returns an object with the same category keys as the old Gemini response.
 */
export async function getPlacesRecommendations(location) {
  const apiKey = getPlacesApiKey();
  if (!apiKey?.trim()) {
    throw new Error('Google Places API key is required.');
  }
  if (!location?.trim()) {
    throw new Error('Please provide a location.');
  }

  const cacheKey = getCacheKey(location);
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const categories = Object.entries(CATEGORY_QUERIES);
  const results = await Promise.allSettled(
    categories.map(([, query]) => searchCategory(query, location.trim(), apiKey))
  );

  const data = {};
  categories.forEach(([key], i) => {
    const result = results[i];
    data[key] = result.status === 'fulfilled' ? result.value : [];
  });

  setCache(cacheKey, data);
  return data;
}
