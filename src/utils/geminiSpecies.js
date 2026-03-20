import { getApiKey, hasEnvKey, API_URL, fetchWithRetry, extractJSON, getResponseText } from './gemini';
import { IDEAL_TEMP_RANGES } from './solunar';

const CACHE_KEY = 'fishing-app-species-cache-v4';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

const DEFAULT_SPECIES_KEYS = ['largemouth_bass', 'rainbow_trout', 'walleye', 'crappie', 'channel_catfish'];

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

function getFallbackResult() {
  return DEFAULT_SPECIES_KEYS.map(k => ({
    key: k,
    label: IDEAL_TEMP_RANGES[k].label,
    ideal: IDEAL_TEMP_RANGES[k].ideal,
    good: IDEAL_TEMP_RANGES[k].good,
  }));
}

function validateSpecies(entry) {
  return (
    entry &&
    typeof entry.key === 'string' &&
    typeof entry.label === 'string' &&
    Array.isArray(entry.ideal) && entry.ideal.length === 2 &&
    Array.isArray(entry.good) && entry.good.length === 2 &&
    typeof entry.ideal[0] === 'number' && typeof entry.ideal[1] === 'number' &&
    typeof entry.good[0] === 'number' && typeof entry.good[1] === 'number'
  );
}

/**
 * Get the top 5 sport fish species for a given water body using Gemini AI.
 * Returns an array of { key, label, ideal, good } objects.
 */
export async function getLocalSpecies({ waterBodyName, lat, lng }) {
  const cacheKey = getCacheKey(lat, lng);
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const key = getApiKey();
  if (!key?.trim() && !hasEnvKey()) {
    return getFallbackResult();
  }

  const locationDesc = waterBodyName
    ? `Water body: ${waterBodyName} (coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)})`
    : `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;

  const body = {
    contents: [
      {
        parts: [
          {
            text: `You are an expert fisheries biologist. Given the following water body, return ONLY the sport fish species that are confirmed present there — either naturally occurring, stocked by the state wildlife agency, or well-documented by anglers.

${locationDesc}

IMPORTANT:
- Do NOT guess or assume species based on the region. Only include species you are confident actually live in THIS specific water body.
- Check if this water body is stocked by the state (e.g. many Arizona rivers are stocked with rainbow trout in winter).
- Consider what anglers commonly catch here based on fishing reports.
- If unsure about a species, leave it out. Accuracy matters more than completeness.

Return up to 8 species ranked by how commonly they are caught here (most common first).

For each species provide its ideal and good water temperature ranges in Fahrenheit.

Respond ONLY with valid JSON in this exact format (no markdown, no code fences):
{"species":[{"key":"rainbow_trout","label":"Rainbow Trout","ideal":[50,60],"good":[40,65]},{"key":"largemouth_bass","label":"Largemouth Bass","ideal":[65,80],"good":[55,85]}]}

Rules:
- key must be snake_case (e.g. "rainbow_trout", "largemouth_bass")
- label is the common display name
- ideal is [min, max] in °F for peak feeding activity
- good is [min, max] in °F for the broader active range
- Only include species confirmed present in this specific water body
- Rank by how commonly caught, most common first`,
          },
        ],
      },
    ],
  };

  try {
    const res = await fetchWithRetry(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }, key);

    if (!res.ok) {
      return getFallbackResult();
    }

    const data = await res.json();
    const text = getResponseText(data);
    if (!text) return getFallbackResult();

    const result = extractJSON(text);
    if (!result || !Array.isArray(result.species)) {
      return getFallbackResult();
    }

    const valid = result.species.filter(validateSpecies);
    if (valid.length === 0) return getFallbackResult();

    // Take up to 8
    const finalResult = valid.slice(0, 8);
    setCache(cacheKey, finalResult);
    return finalResult;
  } catch {
    return getFallbackResult();
  }
}
