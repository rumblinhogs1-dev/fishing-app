import { API_URL, fetchWithRetry } from './gemini';
const CACHE_KEY = 'fishing-species-info-cache';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_CACHE = 50;

function getCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY)) || {};
  } catch {
    return {};
  }
}

function setCache(cache) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

function evictLRU(cache) {
  const entries = Object.entries(cache);
  if (entries.length <= MAX_CACHE) return cache;
  entries.sort((a, b) => a[1].accessedAt - b[1].accessedAt);
  const pruned = {};
  const keep = entries.slice(entries.length - MAX_CACHE);
  for (const [key, val] of keep) {
    pruned[key] = val;
  }
  return pruned;
}

/**
 * Fetch species info from Gemini (text-only, no image).
 * Results are cached in localStorage with 7-day TTL.
 */
export async function getSpeciesInfo(speciesName, apiKey) {
  if (!speciesName || !apiKey?.trim()) return null;

  const cacheKey = speciesName.toLowerCase().trim();
  const cache = getCache();

  // Check cache
  if (cache[cacheKey] && Date.now() - cache[cacheKey].storedAt < CACHE_TTL) {
    cache[cacheKey].accessedAt = Date.now();
    setCache(cache);
    return cache[cacheKey].data;
  }

  const body = {
    contents: [
      {
        parts: [
          {
            text: `You are a fish species expert. Provide detailed information about "${speciesName}".

Respond ONLY with valid JSON in this exact format (no markdown, no code fences):
{"commonName": "Common Name", "scientificName": "Latin name", "sizeRange": "12-24 inches typical", "weightRange": "1-8 lbs typical", "habitat": "Description of typical habitat", "peakSeason": "Best months/seasons to catch this species", "stateRecord": "Notable state record if well-known, or typical trophy size", "funFact": "One interesting or surprising fact about this species"}`,
          },
        ],
      },
    ],
  };

  const res = await fetchWithRetry(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, apiKey);

  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    const msg = errData?.error?.message || '';
    if (res.status === 429) throw new Error('Rate limit exceeded. Retries exhausted — please wait a minute and try again.');
    if (res.status === 401 || res.status === 403) throw new Error('Invalid or unauthorized API key.');
    throw new Error(msg || `Species info request failed (${res.status}).`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No species info returned.');

  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  const parsed = JSON.parse(cleaned);

  // Store in cache
  const updated = evictLRU({
    ...cache,
    [cacheKey]: { data: parsed, storedAt: Date.now(), accessedAt: Date.now() },
  });
  setCache(updated);

  return parsed;
}
