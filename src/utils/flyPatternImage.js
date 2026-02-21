import { getApiKey, fetchWithRetry } from './gemini';

const CACHE_KEY = 'fishing-app-fly-images';
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days
const IMAGE_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

function getCache(flyName) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw);
    const entry = cache[flyName];
    if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
    delete cache[flyName];
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch { /* ignore */ }
  return null;
}

function setCache(flyName, dataUrl) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const cache = raw ? JSON.parse(raw) : {};
    // Keep cache small — max 20 entries
    const keys = Object.keys(cache);
    if (keys.length >= 20) {
      const oldest = keys.sort((a, b) => cache[a].ts - cache[b].ts)[0];
      delete cache[oldest];
    }
    cache[flyName] = { data: dataUrl, ts: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch { /* ignore — localStorage might be full */ }
}

/**
 * Get an image of a fly pattern using Gemini image generation.
 * Returns a base64 data URL or null if generation fails.
 */
export async function getFlyPatternImage(flyPattern, insectName) {
  const cacheKey = flyPattern.toLowerCase().trim();
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const key = getApiKey();
  if (!key?.trim()) return null;

  const body = {
    contents: [{
      parts: [{
        text: `Generate a detailed, realistic close-up photograph of a "${flyPattern}" fly fishing fly (artificial fly lure that imitates the ${insectName} insect). Show the fly on a plain white background. The image should clearly show the hook, thread wrapping, hackle, tail, and body materials. Make it look like a product photo from a fly fishing catalog.`,
      }],
    }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  };

  try {
    const res = await fetchWithRetry(IMAGE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }, key);

    if (!res.ok) return null;

    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType || 'image/png';
        const dataUrl = `data:${mime};base64,${part.inlineData.data}`;
        setCache(cacheKey, dataUrl);
        return dataUrl;
      }
    }
    return null;
  } catch {
    return null;
  }
}
