import { auth } from '../firebase';

const API_KEY_STORAGE = 'fishing-log-gemini-key';
const GEMINI_MODEL = 'gemini-2.5-flash';
export const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const PROXY_URL = '/api/gemini';
const MAX_SIZE = 512;
const MAX_RETRIES = 1;
const BASE_DELAY_MS = 2000;
const FETCH_TIMEOUT_MS = 30000;

/**
 * Returns the Gemini API key from env var or localStorage fallback.
 * When using the server proxy, this may return empty (key lives server-side).
 */
export function getApiKey() {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey) return envKey;
  return localStorage.getItem(API_KEY_STORAGE) || '';
}

/**
 * Returns true if the key comes from the env var (not user-entered).
 * Also returns true when using the server proxy (key is server-side).
 */
export function hasEnvKey() {
  return !!import.meta.env.VITE_GEMINI_API_KEY || !!auth?.currentUser;
}

/**
 * Saves a user-provided API key to localStorage.
 */
export function saveApiKey(key) {
  localStorage.setItem(API_KEY_STORAGE, key);
}

/**
 * Try to get a Firebase Auth token for the server proxy.
 * Returns null if not authenticated.
 */
async function getAuthToken() {
  try {
    return await auth?.currentUser?.getIdToken();
  } catch {
    return null;
  }
}

/**
 * Fetch with automatic retry on 429 (rate limit) using exponential backoff.
 * Routes through the server proxy when the user is authenticated (keeps API key server-side).
 * Falls back to direct API call with client-side key if not authenticated.
 */
export async function fetchWithRetry(url, options, apiKey) {
  const authToken = await getAuthToken();
  const useProxy = !!authToken && url === API_URL;

  if (useProxy) {
    // Route through server proxy — API key stays server-side
    url = PROXY_URL;
    options = {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${authToken}`,
      },
    };
  } else if (apiKey) {
    // Fallback: direct API call with client-side key (unauthenticated users)
    options = {
      ...options,
      headers: { ...options.headers, 'x-goog-api-key': apiKey.trim() },
    };
  }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    let res;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
    } catch (err) {
      if (attempt === MAX_RETRIES) {
        if (!navigator.onLine) {
          throw new Error('You appear to be offline. Please check your internet connection.');
        }
        throw new Error('Network error. Could not reach the Gemini API. Please try again.');
      }
      // Retry network errors too
      await new Promise((r) => setTimeout(r, BASE_DELAY_MS * 2 ** attempt));
      continue;
    }

    if (attempt < MAX_RETRIES && (res.status === 429 || res.status >= 500)) {
      const retryAfter = res.headers.get('Retry-After');
      const delay = retryAfter
        ? parseInt(retryAfter, 10) * 1000
        : Math.min(BASE_DELAY_MS * 2 ** attempt, 30000);
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }

    return res;
  }
}

/**
 * Extract the response text from a Gemini API response.
 * Gemini 2.5 Flash returns thinking/reasoning in earlier parts — this
 * finds the last non-thought text part (the actual answer).
 */
export function getResponseText(data) {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  // Prefer the last non-thought text part; fall back to any text part
  return parts.filter(p => !p.thought).map(p => p.text).filter(Boolean).pop()
    || parts.map(p => p.text).filter(Boolean).pop()
    || '';
}

/**
 * Robustly extract a JSON object from Gemini's text response.
 * Handles markdown code fences, preamble text, trailing commas, etc.
 */
export function extractJSON(text) {
  function stripTrailingCommas(s) {
    return s.replace(/,\s*([\]}])/g, '$1');
  }

  try { return JSON.parse(text); } catch { /* continue */ }

  const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  try { return JSON.parse(cleaned); } catch { /* continue */ }
  try { return JSON.parse(stripTrailingCommas(cleaned)); } catch { /* continue */ }

  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch { /* continue */ }
    try { return JSON.parse(stripTrailingCommas(match[0])); } catch { /* continue */ }
  }

  return null;
}

/**
 * Resize an image File to a max dimension and return a JPEG base64 data URL.
 */
export function resizeImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Please select a valid image file.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read the image file.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load the image. The file may be corrupted.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          } else {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Send an image to Gemini for fish identification.
 * @param {string} imageDataUrl - base64 data URL of the image
 * @param {string} apiKey - Gemini API key
 * @returns {Promise<object>} - parsed identification result
 */
export async function identifyFish(imageDataUrl, apiKey) {
  if (!apiKey?.trim() && !hasEnvKey()) {
    throw new Error('API key is required. Set VITE_GEMINI_API_KEY in your .env file or enter it manually.');
  }
  if (!imageDataUrl) {
    throw new Error('No image provided.');
  }

  const base64 = imageDataUrl.split(',')[1];
  if (!base64) {
    throw new Error('Invalid image data.');
  }

  const body = {
    contents: [
      {
        parts: [
          {
            text: `You are a fish species identification expert and experienced angler. Analyze this image and identify the fish species. Also estimate the fish's size and weight based on visual cues in the photo (hands, lures, boat features, etc. for scale). Infer the most likely weather conditions and geographic location where this fish was caught based on the species, surroundings, lighting, vegetation, water color, and any other contextual clues in the image.

Additionally, estimate the approximate age of the fish based on the identified species, estimated length and weight, and likely geographic region. Use known species growth rates and regional growth data to provide a reasonable age range (e.g. "2-3 years"). Consider that growth rates vary by region, water temperature, and food availability.

Also provide your 2nd and 3rd most likely species guesses in an "alternatives" array, each with species, scientificName, and confidence.

Respond ONLY with valid JSON in this exact format (no markdown, no code fences):
{"species": "Common Name", "scientificName": "Latin name", "confidence": 85, "estimatedLength": "18-20 inches", "estimatedWeight": "3-4 lbs", "estimatedAge": "2-3 years", "weather": "Partly cloudy, approx 72°F, light breeze", "location": "Freshwater lake, likely southeastern United States", "description": "Brief 1-2 sentence description of key identifying features you see.", "habitat": "Brief typical habitat info.", "funFact": "One interesting fact about this species.", "alternatives": [{"species": "Second Choice", "scientificName": "Latin name", "confidence": 10}, {"species": "Third Choice", "scientificName": "Latin name", "confidence": 5}]}

If no fish is visible, respond with:
{"species": "No fish detected", "scientificName": "", "confidence": 0, "estimatedLength": "", "estimatedWeight": "", "estimatedAge": "", "weather": "", "location": "", "description": "No fish could be identified in this image.", "habitat": "", "funFact": "", "alternatives": []}

The confidence should be 0-100 representing how certain you are of the identification. Each alternative should also have a confidence score. For estimatedLength and estimatedWeight, give a range if exact estimation is difficult. For estimatedAge, provide an age range based on the species' typical growth curve for the estimated size and region (e.g. "1-2 years", "4-6 years"). For weather, describe conditions you can infer from lighting, sky, clothing, etc. For location, be as specific as possible based on species range, terrain, water type, and any visible landmarks or vegetation.`,
          },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      thinkingConfig: { thinkingBudget: 1024 },
    },
  };

  const res = await fetchWithRetry(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, apiKey);

  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    const msg = errData?.error?.message || '';

    if (res.status === 400) {
      throw new Error(msg.includes('API key') ? 'Invalid API key. Please check your Gemini API key.' : `Bad request: ${msg || 'The image could not be processed.'}`);
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error('Invalid or unauthorized API key. Please check your Gemini API key.');
    }
    if (res.status === 429) {
      throw new Error('Rate limit exceeded. The free Gemini API allows ~15 requests/min. Please wait a minute and try again.');
    }
    if (res.status >= 500) {
      throw new Error('Gemini API is temporarily unavailable. Please try again later.');
    }
    throw new Error(msg || `API request failed (${res.status}).`);
  }

  const data = await res.json();

  const text = getResponseText(data);
  if (!text) {
    const finishReason = data.candidates?.[0]?.finishReason;
    if (finishReason === 'SAFETY') {
      throw new Error('The image was blocked by safety filters. Please try a different photo.');
    }
    throw new Error('No response received from Gemini. Please try a different photo.');
  }

  const parsed = extractJSON(text);
  if (!parsed || typeof parsed.species !== 'string') {
    throw new Error('Could not parse the AI response. Please try again with a clearer photo.');
  }
  parsed.alternatives = Array.isArray(parsed.alternatives) ? parsed.alternatives : [];
  return parsed;
}
