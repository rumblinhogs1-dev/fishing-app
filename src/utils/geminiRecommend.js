import { getApiKey, API_URL, fetchWithRetry } from './gemini';

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

  const body = {
    contents: [
      {
        parts: [
          {
            text: `You are an expert fishing guide. Based on the following conditions, recommend the best lures, flies, and techniques. Also include information about local insect hatches or baitfish that might be relevant.

${conditions}

Respond ONLY with valid JSON in this exact format (no markdown, no code fences):
{"recommendations": [{"type": "Lure type or fly pattern", "name": "Specific name", "color": "Recommended color", "size": "Recommended size", "technique": "How to use it", "reasoning": "Why this is a good choice for these conditions", "confidence": 85}], "hatchInfo": "Information about current insect hatches, baitfish activity, or natural food sources that are likely present given the conditions", "generalTips": "General fishing tips for these conditions", "bestTimeOfDay": "Recommended time to fish given these conditions"}

Provide 3-5 recommendations sorted by confidence (highest first). Confidence should be 0-100.`,
          },
        ],
      },
    ],
  };

  const res = await fetchWithRetry(`${API_URL}?key=${key.trim()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

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

  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error('Could not parse the AI response. Please try again.');
  }
}
