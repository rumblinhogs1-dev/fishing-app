import { getApiKey, API_URL, fetchWithRetry, extractJSON } from './gemini';
import { IDEAL_TEMP_RANGES } from './solunar';

const CACHE_KEY = 'fishing-app-species-cache';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

const DEFAULT_SPECIES = ['largemouth_bass', 'rainbow_trout', 'walleye', 'crappie', 'channel_catfish'];

const KNOWN_KEYS = Object.keys(IDEAL_TEMP_RANGES);

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
  return { species: DEFAULT_SPECIES, additional: [] };
}

/**
 * Get the species that actually exist in a given water body using Gemini AI.
 * Returns { species: string[], additional: { key, label, ideal, good }[] }
 */
export async function getLocalSpecies({ waterBodyName, lat, lng }) {
  const cacheKey = getCacheKey(lat, lng);
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const key = getApiKey();
  if (!key?.trim()) {
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
            text: `You are an expert fisheries biologist. Given the following water body, identify which sport fish species are actually present there.

${locationDesc}

Here are the species keys I know about:
${KNOWN_KEYS.join(', ')}

From that list, return 3-8 keys for species that actually live in this water body. Do NOT include species that are not present — accuracy matters more than quantity.

Also, if there are 1-3 additional important sport fish in this water body that are NOT in my list above, include them as "additional" entries with their temperature preferences in Fahrenheit.

Respond ONLY with valid JSON in this exact format (no markdown, no code fences):
{"species":["largemouth_bass","channel_catfish"],"additional":[{"key":"white_bass","label":"White Bass","ideal":[65,75],"good":[55,80]}]}

The "species" array must only contain keys from my list. The "additional" array can be empty. Each additional entry must have key (snake_case), label (display name), ideal ([min,max] in °F), and good ([min,max] in °F).`,
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
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return getFallbackResult();

    const result = extractJSON(text);
    if (!result || !Array.isArray(result.species)) {
      return getFallbackResult();
    }

    // Validate: only keep known keys
    const validSpecies = result.species.filter(k => KNOWN_KEYS.includes(k));
    if (validSpecies.length === 0) return getFallbackResult();

    // Validate additional species entries
    const validAdditional = (Array.isArray(result.additional) ? result.additional : []).filter(a =>
      a &&
      typeof a.key === 'string' &&
      typeof a.label === 'string' &&
      Array.isArray(a.ideal) && a.ideal.length === 2 &&
      Array.isArray(a.good) && a.good.length === 2 &&
      typeof a.ideal[0] === 'number' && typeof a.ideal[1] === 'number' &&
      typeof a.good[0] === 'number' && typeof a.good[1] === 'number'
    );

    const finalResult = { species: validSpecies, additional: validAdditional };
    setCache(cacheKey, finalResult);
    return finalResult;
  } catch {
    return getFallbackResult();
  }
}
