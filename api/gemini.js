/**
 * Vercel serverless function — proxies /api/gemini to the Firebase geminiProxy function.
 * Forwards the Authorization header so Firebase can verify the user.
 */
const FIREBASE_PROXY = 'https://geminiproxy-fiealikwpa-uw.a.run.app';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch(FIREBASE_PROXY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}),
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.text();
    res.status(response.status).setHeader('Content-Type', 'application/json').send(data);
  } catch (err) {
    res.status(502).json({ error: 'Failed to reach Gemini proxy' });
  }
}
