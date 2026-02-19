import { getApiKey, API_URL, fetchWithRetry, extractJSON } from './gemini';
const CACHE_KEY = 'fishing-app-structure-cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function getCacheKey(lat, lng) {
  return `${Math.round(lat * 100) / 100},${Math.round(lng * 100) / 100}`;
}

function getCache(key) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw);
    const entry = cache[key];
    if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
    // Clean expired entry
    delete cache[key];
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch { /* ignore */ }
  return null;
}

function setCache(key, data) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const cache = raw ? JSON.parse(raw) : {};
    cache[key] = { data, ts: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch { /* ignore */ }
}

/**
 * Get AI-powered structure hints for a water body near the given coordinates.
 */
export async function getStructureHints({ waterBodyName, lat, lng }) {
  const cacheKey = getCacheKey(lat, lng);
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const key = getApiKey();
  if (!key?.trim()) {
    throw new Error('API key is required for structure analysis.');
  }

  const locationDesc = waterBodyName
    ? `Water body: ${waterBodyName} (coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)})`
    : `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;

  const body = {
    contents: [
      {
        parts: [
          {
            text: `You are an expert fishing guide and aquatic structure analyst. Analyze the following water body and describe the typical underwater structures and fishing hotspots that would be found there.

${locationDesc}

Respond ONLY with valid JSON in this exact format (no markdown, no code fences):
{"waterBodyType": "lake/river/reservoir/pond/stream/creek", "typicalDepthRange": "e.g. 5-45 ft", "structures": [{"type": "drop-off/point/hump/creek channel/ledge/submerged timber/rock pile/weed bed/dam/bridge piling", "name": "Short descriptive name", "description": "Where this structure is typically found in this type of water body", "bestSpecies": ["species1", "species2"], "bestDepthRange": "e.g. 8-15 ft", "fishingTip": "How to fish this structure effectively"}]}

Provide 4-6 structure types most relevant to this water body. Be specific to the type and region of this water body.`,
          },
        ],
      },
    ],
  };

  const res = await fetchWithRetry(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, key);

  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    const msg = errData?.error?.message || '';
    if (res.status === 429) throw new Error('Rate limit exceeded. Retries exhausted — please wait a minute and try again.');
    if (res.status === 401 || res.status === 403) throw new Error('Invalid or unauthorized API key.');
    if (res.status >= 500) throw new Error('Gemini API temporarily unavailable.');
    throw new Error(msg || `API request failed (${res.status}).`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No response received.');

  const result = extractJSON(text);
  if (!result || !Array.isArray(result.structures)) {
    throw new Error('AI structure analysis temporarily unavailable. Please try again.');
  }

  setCache(cacheKey, result);
  return result;
}
