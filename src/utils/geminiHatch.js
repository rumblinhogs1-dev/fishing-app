import { getApiKey, hasEnvKey, API_URL, fetchWithRetry, extractJSON, getResponseText } from './gemini';

const CACHE_KEY = 'fishing-app-hatch-cache';
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

function getFallbackData() {
  return {
    currentHatches: [
      { name: 'Blue-Winged Olive', order: 'Ephemeroptera', flyPattern: 'BWO Parachute', size: '16-20', color: 'Olive/Gray', activityLevel: 'moderate', bestTime: 'Midday' },
      { name: 'Elk Hair Caddis', order: 'Trichoptera', flyPattern: 'Elk Hair Caddis', size: '14-18', color: 'Tan/Brown', activityLevel: 'moderate', bestTime: 'Evening' },
      { name: 'Zebra Midge', order: 'Diptera', flyPattern: 'Zebra Midge', size: '18-22', color: 'Black/Silver', activityLevel: 'high', bestTime: 'Morning' },
    ],
    dailyTimeline: [
      { period: 'Early Morning', insects: ['Midges'], intensity: 3 },
      { period: 'Morning', insects: ['Midges', 'Blue-Winged Olives'], intensity: 4 },
      { period: 'Midday', insects: ['Blue-Winged Olives'], intensity: 3 },
      { period: 'Afternoon', insects: ['Caddis'], intensity: 2 },
      { period: 'Evening', insects: ['Caddis', 'Mayflies'], intensity: 4 },
    ],
    monthlyCalendar: [
      { month: 'January', insects: ['Midges'], intensity: 2, notes: 'Limited hatches' },
      { month: 'February', insects: ['Midges', 'Blue-Winged Olives'], intensity: 2, notes: 'Early BWO activity' },
      { month: 'March', insects: ['Blue-Winged Olives', 'Midges'], intensity: 3, notes: 'BWO hatches increase' },
      { month: 'April', insects: ['Hendricksons', 'Caddis'], intensity: 4, notes: 'Major hatches begin' },
      { month: 'May', insects: ['Sulphurs', 'March Browns', 'Caddis'], intensity: 5, notes: 'Peak hatch season' },
      { month: 'June', insects: ['Green Drakes', 'Sulphurs', 'Caddis'], intensity: 5, notes: 'Excellent hatches' },
      { month: 'July', insects: ['Tricos', 'Terrestrials', 'Caddis'], intensity: 4, notes: 'Trico spinners' },
      { month: 'August', insects: ['Tricos', 'Terrestrials'], intensity: 3, notes: 'Terrestrials dominate' },
      { month: 'September', insects: ['Blue-Winged Olives', 'Caddis'], intensity: 4, notes: 'Fall BWO hatches' },
      { month: 'October', insects: ['Blue-Winged Olives', 'Midges'], intensity: 3, notes: 'Late season BWOs' },
      { month: 'November', insects: ['Midges', 'Blue-Winged Olives'], intensity: 2, notes: 'Hatches taper off' },
      { month: 'December', insects: ['Midges'], intensity: 1, notes: 'Minimal activity' },
    ],
  };
}

/**
 * Get insect hatch data for a water body near the given coordinates.
 */
export async function getInsectHatch({ waterBodyName, lat, lng, waterTemp, month }) {
  const cacheKey = getCacheKey(lat, lng);
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const key = getApiKey();
  if (!key?.trim() && !hasEnvKey()) {
    return getFallbackData();
  }

  const locationDesc = waterBodyName
    ? `Water body: ${waterBodyName} (coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)})`
    : `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;

  const tempInfo = waterTemp != null ? `Current water temperature: ${waterTemp}°F` : '';
  const monthInfo = month ? `Current month: ${month}` : `Current month: ${new Date().toLocaleString('en-US', { month: 'long' })}`;

  const body = {
    contents: [
      {
        parts: [
          {
            text: `You are an expert entomologist and fly fishing guide. Analyze the following water body and provide detailed insect hatch data for fly fishermen.

${locationDesc}
${monthInfo}
${tempInfo}

Respond ONLY with valid JSON in this exact format (no markdown, no code fences):
{"currentHatches":[{"name":"Insect common name","order":"Ephemeroptera/Trichoptera/Diptera/Plecoptera","flyPattern":"Recommended fly pattern","size":"Hook size range","color":"Primary colors","activityLevel":"high/moderate/low","bestTime":"Best time of day"}],"dailyTimeline":[{"period":"Early Morning","insects":["insect1"],"intensity":3},{"period":"Morning","insects":["insect1","insect2"],"intensity":4},{"period":"Midday","insects":["insect1"],"intensity":2},{"period":"Afternoon","insects":["insect1"],"intensity":3},{"period":"Evening","insects":["insect1","insect2"],"intensity":5}],"monthlyCalendar":[{"month":"January","insects":["insect1"],"intensity":2,"notes":"Brief note"},{"month":"February","insects":["insect1"],"intensity":2,"notes":"Brief note"}]}

Provide 3-5 insects in currentHatches that are active now. Provide all 5 time periods in dailyTimeline with intensity 1-5. Provide all 12 months in monthlyCalendar with intensity 1-5. Be specific to the region, water body type, and season.`,
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
      const errData = await res.json().catch(() => null);
      const msg = errData?.error?.message || '';
      if (res.status === 429) throw new Error('Rate limit exceeded. Retries exhausted — please wait a minute and try again.');
      if (res.status === 401 || res.status === 403) throw new Error('Invalid or unauthorized API key.');
      if (res.status >= 500) throw new Error('Gemini API temporarily unavailable.');
      throw new Error(msg || `API request failed (${res.status}).`);
    }

    const data = await res.json();
    const text = getResponseText(data);
    if (!text) throw new Error('No response received.');

    const result = extractJSON(text);
    if (!result || !Array.isArray(result.currentHatches)) {
      throw new Error('AI hatch data temporarily unavailable. Please try again.');
    }

    setCache(cacheKey, result);
    return result;
  } catch {
    return getFallbackData();
  }
}
