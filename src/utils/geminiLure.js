import { getApiKey, hasEnvKey, API_URL, fetchWithRetry, extractJSON } from './gemini';

export async function identifyLure(imageDataUrl, apiKey) {
  const key = apiKey || getApiKey();
  if (!key?.trim() && !hasEnvKey()) {
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
            text: `You are a fishing lure and fly identification expert. Analyze this image and identify the lure, fly, or bait shown.

Respond ONLY with valid JSON in this exact format (no markdown, no code fences):
{"type": "Lure|Fly|Live Bait|Soft Plastic|Hard Bait|Spinnerbait|Jig|Spoon|Crankbait|Other", "name": "Specific name or model if identifiable", "category": "Topwater|Subsurface|Bottom|Midwater|Surface", "color": "Primary color pattern", "size": "Estimated size", "technique": "Best retrieval technique or presentation method", "bestFor": ["Species 1", "Species 2", "Species 3"], "description": "Brief description of the lure and its characteristics", "tips": "Usage tips for this type of lure/fly"}

If no lure, fly, or bait is visible, respond with:
{"type": "Unknown", "name": "No lure detected", "category": "", "color": "", "size": "", "technique": "", "bestFor": [], "description": "No fishing lure, fly, or bait could be identified in this image.", "tips": ""}`,
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
    if (res.status >= 500) throw new Error('Gemini API is temporarily unavailable. Please try again later.');
    throw new Error(msg || `API request failed (${res.status}).`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('No response received from Gemini. Please try a different photo.');
  }

  const parsed = extractJSON(text);
  if (!parsed || typeof parsed.type !== 'string') {
    throw new Error('Could not parse the AI response. Please try again with a clearer photo.');
  }
  return parsed;
}
