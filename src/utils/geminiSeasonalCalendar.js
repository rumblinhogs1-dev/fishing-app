import { getApiKey, hasEnvKey, API_URL, fetchWithRetry, extractJSON, getResponseText } from './gemini';

const CACHE_KEY = 'fishing-app-seasonal-calendar-cache';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

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

function getFallbackData(waterBodyName) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const qualities = [3, 3, 5, 7, 8, 9, 8, 7, 8, 6, 4, 3];
  const species = [
    ['Trout'], ['Trout'], ['Trout', 'Bass'], ['Bass', 'Trout', 'Crappie'],
    ['Bass', 'Walleye', 'Catfish'], ['Bass', 'Catfish', 'Panfish'], ['Bass', 'Catfish'],
    ['Bass', 'Catfish'], ['Bass', 'Walleye', 'Trout'], ['Trout', 'Walleye'],
    ['Trout', 'Walleye'], ['Trout'],
  ];
  const notes = [
    'Slow fishing, target deep pools', 'Pre-spawn activity begins', 'Spring run starts',
    'Excellent pre-spawn action', 'Peak season begins', 'Summer peak, fish early and late',
    'Hot weather, fish deep or early/late', 'Similar to July, topwater at dawn/dusk',
    'Fall feeding frenzy begins', 'Great fall fishing', 'Late fall, fish slow down',
    'Winter patterns, slow presentations',
  ];
  return {
    waterBody: waterBodyName || 'Local Water Body',
    months: months.map((m, i) => ({ month: m, quality: qualities[i], peakSpecies: species[i], notes: notes[i] })),
    bestMonth: 'June',
    worstMonth: 'January',
    summary: 'Generic seasonal calendar — AI data was unavailable. Actual patterns vary by region.',
  };
}

/**
 * Get a 12-month seasonal fishing calendar for a water body near the given coordinates.
 */
export async function getSeasonalCalendar({ waterBodyName, lat, lng }) {
  const cacheKey = getCacheKey(lat, lng);
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const key = getApiKey();
  if (!key?.trim() && !hasEnvKey()) {
    return getFallbackData(waterBodyName);
  }

  const locationDesc = waterBodyName
    ? `Water body: ${waterBodyName} (coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)})`
    : `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;

  const body = {
    contents: [
      {
        parts: [
          {
            text: `You are an expert fishing guide. Analyze the following water body and provide a month-by-month fishing quality calendar for the entire year.

${locationDesc}

Respond ONLY with valid JSON in this exact format (no markdown, no code fences):
{"waterBody": "Name of water body", "months": [{"month": "January", "quality": 5, "peakSpecies": ["species1", "species2"], "notes": "Brief note about fishing this month"}, {"month": "February", "quality": 4, "peakSpecies": ["species1"], "notes": "Brief note"}], "bestMonth": "June", "worstMonth": "January", "summary": "Brief overall summary of seasonal fishing patterns at this location"}

Provide all 12 months. Quality should be 1-10 (1=poor, 10=excellent). Be specific to the region, water body type, and local species.`,
          },
        ],
      },
    ],
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': key.trim(),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return getFallbackData(waterBodyName);
    }

    const data = await res.json();
    const text = getResponseText(data);
    if (!text) return getFallbackData(waterBodyName);

    const result = extractJSON(text);
    if (!result || !Array.isArray(result.months)) {
      return getFallbackData(waterBodyName);
    }

    setCache(cacheKey, result);
    return result;
  } catch {
    return getFallbackData(waterBodyName);
  }
}
