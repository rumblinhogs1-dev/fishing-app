import { getApiKey, API_URL, fetchWithRetry, extractJSON } from './gemini';

const CACHE_KEY = 'fishing-app-recommendations-cache';
const CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours
const MAX_CACHE_ENTRIES = 30;

function getCacheKey({ location, waterTemp, flowRate, season }) {
  return [location, waterTemp, flowRate, season].filter(Boolean).join('|').toLowerCase();
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

function buildFallback(conditions) {
  return {
    recommendations: [
      {
        type: 'General',
        name: 'Local favorite',
        color: 'Natural',
        size: 'Medium',
        technique: 'Match the hatch — observe what baitfish or insects are present and choose accordingly.',
        reasoning: 'AI recommendations are temporarily unavailable. This general advice applies broadly.',
        confidence: 50,
      },
    ],
    hatchInfo: 'Check local fishing reports for current hatch and baitfish activity.',
    generalTips: conditions.season
      ? `${conditions.season} fishing tip: adjust your retrieve speed and depth based on water temperature.`
      : 'Vary your retrieve speed and depth until you find what works.',
    bestTimeOfDay: 'Early morning and late evening are typically the most productive times.',
  };
}

export async function getRecommendations({ species, location, weather, waterTemp, flowRate, season }, apiKey) {
  const key = apiKey || getApiKey();
  if (!key?.trim()) {
    throw new Error('API key is required.');
  }

  const conditions = [
    species && `Target species: ${species}`,
    location && `Location: ${location}`,
    weather && `Current weather: ${weather}`,
    waterTemp && `Water temperature: ${waterTemp}°F`,
    flowRate && `Flow rate: ${flowRate} ft³/s`,
    season && `Season: ${season}`,
  ].filter(Boolean).join('\n');

  if (!conditions) {
    throw new Error('Please provide at least one condition (species, location, weather, etc.).');
  }

  // Check cache
  const cacheKey = getCacheKey({ location, waterTemp, flowRate, season });
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const body = {
    contents: [
      {
        parts: [
          {
            text: `You are an expert fishing guide. Based on the following conditions, recommend the best lures, flies, and techniques.

${conditions}

IMPORTANT: Respond with ONLY a JSON object. No explanation, no markdown, no code fences. Just the raw JSON.

Required JSON format:
{"recommendations": [{"type": "Lure type or fly pattern", "name": "Specific name", "color": "Recommended color", "size": "Recommended size", "technique": "How to use it", "reasoning": "Why this works for these conditions", "confidence": 85}], "hatchInfo": "Current insect hatches or baitfish activity for these conditions", "generalTips": "General fishing tips", "bestTimeOfDay": "Best time to fish"}

Provide 3-5 recommendations sorted by confidence (highest first). Confidence should be 0-100.`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.7,
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
    if (res.status === 429) return buildFallback({ season });
    if (res.status === 400) throw new Error(msg || 'Bad request — the AI could not process this request.');
    if (res.status === 401 || res.status === 403) throw new Error('Invalid or unauthorized API key.');
    if (res.status >= 500) return buildFallback({ season });
    throw new Error(msg || `API request failed (${res.status}).`);
  }

  const data = await res.json();

  // Check for safety block
  const finishReason = data.candidates?.[0]?.finishReason;
  if (finishReason === 'SAFETY') {
    return buildFallback({ season });
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    return buildFallback({ season });
  }

  const parsed = extractJSON(text);
  if (!parsed || !Array.isArray(parsed.recommendations)) {
    return buildFallback({ season });
  }

  setCache(cacheKey, parsed);
  return parsed;
}
