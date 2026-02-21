import { getApiKey, API_URL, fetchWithRetry, extractJSON } from './gemini';

const CACHE_KEY = 'fishing-app-local-guide-cache-v4';
const CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours
const MAX_CACHE_ENTRIES = 30;

function getCacheKey(location) {
  return (location || '').toLowerCase().trim();
}

function getCache(key) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw);
    const entry = cache[key];
    if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
    delete cache[key];
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch { /* ignore */ }
  return null;
}

function setCache(key, data) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const cache = raw ? JSON.parse(raw) : {};
    // LRU eviction
    const keys = Object.keys(cache);
    if (keys.length >= MAX_CACHE_ENTRIES) {
      let oldest = keys[0];
      for (const k of keys) {
        if (cache[k].ts < cache[oldest].ts) oldest = k;
      }
      delete cache[oldest];
    }
    cache[key] = { data, ts: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch { /* ignore */ }
}

function buildFallback() {
  return {
    fishingGuides: [],
    hotels: [],
    cabins: [],
    camping: [],
    baitShops: [],
    localTips: 'AI recommendations are temporarily unavailable. Try checking local fishing forums or bait shop bulletin boards for current info.',
  };
}

export async function getLocalRecommendations(location, apiKey) {
  const key = apiKey || getApiKey();
  if (!key?.trim()) {
    throw new Error('API key is required.');
  }
  if (!location?.trim()) {
    throw new Error('Please provide a location.');
  }

  const cacheKey = getCacheKey(location);
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const body = {
    contents: [
      {
        parts: [
          {
            text: `You are a local fishing travel expert. For the location "${location}", recommend nearby fishing-related services and accommodations.

CRITICAL: Only recommend REAL businesses that actually exist and can be found on Google Maps or Google Search. Do NOT invent or fabricate business names. If you are not confident a business exists, do not include it. It is better to return fewer results than to include fake ones.

IMPORTANT: Respond with ONLY a JSON object. No explanation, no markdown, no code fences. Just the raw JSON.

Required JSON format:
{"fishingGuides": [{"name": "Real guide/charter name", "description": "Brief description of services", "priceRange": "$100-200/trip", "specialty": "Species or technique specialty", "rating": 4.5, "reviewCount": 128}], "hotels": [{"name": "Real hotel name", "description": "Brief description", "priceRange": "$80-150/night", "distanceToWater": "5 min drive", "rating": 4.2, "reviewCount": 95}], "cabins": [{"name": "Real cabin/lodge name", "description": "Brief description", "priceRange": "$120-200/night", "amenities": "Key amenities", "rating": 4.7, "reviewCount": 64}], "camping": [{"name": "Real campground name", "description": "Brief description", "priceRange": "$20-40/night", "features": "Key features", "rating": 4.0, "reviewCount": 210}], "baitShops": [{"name": "Real shop name", "description": "Brief description", "priceRange": "$", "services": "Key services like live bait, tackle rental, etc.", "rating": 4.3, "reviewCount": 47}], "localTips": "2-3 sentences of local fishing tips for this area", "regulationsUrl": "https://example.com/state-fishing-regulations", "licenseUrl": "https://example.com/buy-fishing-license"}

Provide 1-4 recommendations per category. ONLY include businesses you are confident actually exist. Do NOT include website URLs for individual businesses. Include an estimated Google rating (1-5) and approximate review count for each business. Include "regulationsUrl" (a URL to the state/region fishing regulations page) and "licenseUrl" (a URL to apply for or purchase a fishing license in that state/region) — these should be real official government URLs.`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.3,
    },
  };

  const res = await fetchWithRetry(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, key);

  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    const msg = errData?.error?.message || '';
    if (res.status === 429) throw new Error('Rate limit reached. Please wait a minute and try again.');
    if (res.status === 401 || res.status === 403) throw new Error('Invalid or unauthorized API key.');
    if (res.status >= 500) throw new Error('AI service temporarily unavailable. Please try again later.');
    throw new Error(msg || `API request failed (${res.status}).`);
  }

  const data = await res.json();

  const finishReason = data.candidates?.[0]?.finishReason;
  if (finishReason === 'SAFETY') {
    return buildFallback();
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    return buildFallback();
  }

  const parsed = extractJSON(text);
  if (!parsed || typeof parsed !== 'object') {
    return buildFallback();
  }

  setCache(cacheKey, parsed);
  return parsed;
}
