import { getApiKey, API_URL, fetchWithRetry } from './gemini';

export async function getRegulationSummary({ state, species, location }, apiKey) {
  const key = apiKey || getApiKey();
  if (!key?.trim()) throw new Error('API key is required.');

  const context = [
    state && `State: ${state}`,
    species && `Species: ${species}`,
    location && `Location: ${location}`,
  ].filter(Boolean).join(', ');

  if (!context) throw new Error('Please provide state, species, or location.');

  const body = {
    contents: [
      {
        parts: [
          {
            text: `You are a fishing regulations expert. Provide a concise summary of current fishing regulations for: ${context}

Include:
- Season dates (open/closed)
- Size limits (minimum/maximum length)
- Daily bag limits
- Any special restrictions or gear limitations
- License requirements

IMPORTANT: End with this disclaimer: "This information is for reference only. Regulations change frequently. Always verify current rules with the official state wildlife agency before fishing."

Respond ONLY with valid JSON (no markdown, no code fences):
{"summary": "Concise regulation summary paragraph", "keyRules": [{"rule": "Rule description", "type": "limit|season|gear|license"}], "disclaimer": "This information is for reference only. Regulations change frequently. Always verify current rules with the official state wildlife agency before fishing.", "officialSource": "URL to official regulations if known"}`,
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
    throw new Error('Could not parse AI response.');
  }
}
