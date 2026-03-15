import { getApiKey, hasEnvKey, fetchWithRetry, API_URL } from './gemini';

/**
 * Scan a receipt image using Gemini AI and extract expense data.
 * Returns { total, items[], description, category }.
 */
export async function scanReceipt(imageDataUrl) {
  const key = getApiKey();
  if (!key && !hasEnvKey()) {
    throw new Error('No API key configured.');
  }

  const base64 = imageDataUrl.split(',')[1];
  const mimeType = imageDataUrl.split(';')[0].split(':')[1] || 'image/jpeg';

  const body = {
    contents: [{
      parts: [
        {
          inlineData: { mimeType, data: base64 },
        },
        {
          text: `Analyze this receipt image. Extract:
1. The total amount paid (just the final total, including tax/tip if shown)
2. A short description of what was purchased (e.g. "Gas at Shell", "Bait and tackle", "Lunch at Cracker Barrel")
3. The best category from: gas, lodging, bait, food, guide, gear, other
4. Individual line items if visible (name and price)

Respond ONLY with valid JSON in this exact format:
{
  "total": 45.67,
  "description": "Lunch at Cracker Barrel",
  "category": "food",
  "items": [
    { "name": "Country Fried Steak", "price": 12.99 },
    { "name": "Sweet Tea x3", "price": 8.97 }
  ]
}

If you cannot read the receipt clearly, respond with:
{ "error": "Could not read receipt" }`,
        },
      ],
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 1024,
    },
  };

  const res = await fetchWithRetry(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, key);

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error?.message || 'Failed to scan receipt');
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  // Extract JSON from response (may be wrapped in markdown code blocks)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse receipt data');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  if (parsed.error) {
    throw new Error(parsed.error);
  }

  return {
    total: Number(parsed.total) || 0,
    description: parsed.description || 'Receipt',
    category: parsed.category || 'other',
    items: Array.isArray(parsed.items) ? parsed.items : [],
  };
}
