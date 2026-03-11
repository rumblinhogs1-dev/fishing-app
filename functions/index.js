const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent`;
const PLACES_URL = 'https://places.googleapis.com/v1/places:searchText';

/**
 * Verify Firebase Auth ID token from Authorization header.
 * Returns the decoded token or null.
 */
async function verifyAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    return await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
  } catch {
    return null;
  }
}

/**
 * Proxy Gemini API calls. Keeps the API key server-side.
 * Client sends the full Gemini request body; function adds the key and forwards.
 */
exports.geminiProxy = onRequest(
  { cors: true, region: 'us-west1', maxInstances: 20 },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const user = await verifyAuth(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'Gemini API key not configured on server' });
      return;
    }

    try {
      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(req.body),
      });

      const data = await response.text();
      res.status(response.status).set('Content-Type', 'application/json').send(data);
    } catch (err) {
      res.status(502).json({ error: 'Failed to reach Gemini API' });
    }
  }
);

/**
 * Proxy Google Places API calls. Keeps the API key server-side.
 * Client sends { textQuery, maxResultCount, fieldMask }.
 */
exports.placesProxy = onRequest(
  { cors: true, region: 'us-west1', maxInstances: 10 },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const user = await verifyAuth(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'Places API key not configured on server' });
      return;
    }

    const { textQuery, maxResultCount, fieldMask } = req.body;
    if (!textQuery) {
      res.status(400).json({ error: 'textQuery is required' });
      return;
    }

    try {
      const response = await fetch(PLACES_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': fieldMask || 'places.displayName',
        },
        body: JSON.stringify({ textQuery, maxResultCount: maxResultCount || 5 }),
      });

      const data = await response.text();
      res.status(response.status).set('Content-Type', 'application/json').send(data);
    } catch (err) {
      res.status(502).json({ error: 'Failed to reach Places API' });
    }
  }
);

/**
 * Email subscribe endpoint. Stores emails in Firestore 'subscribers' collection.
 * No auth required — this is for pre-launch capture from the landing page.
 */
exports.subscribeEmail = onRequest(
  { cors: true, region: 'us-west1', maxInstances: 5 },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'Valid email is required' });
      return;
    }

    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    try {
      const db = admin.firestore();
      const ref = db.collection('subscribers').doc(trimmed);
      const existing = await ref.get();

      if (existing.exists) {
        res.json({ ok: true, message: 'Already subscribed' });
        return;
      }

      await ref.set({
        email: trimmed,
        subscribedAt: admin.firestore.FieldValue.serverTimestamp(),
        source: req.body.source || 'landing',
      });

      // Send emails
      try {
        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const confirmHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:#1b4332;padding:32px 24px;text-align:center;">
            <img src="https://catchdaddy.net/fishing-app/assets/logo-icon.svg" alt="CatchDaddy" width="80" height="80" style="display:block;margin:0 auto 12px;" />
            <h1 style="margin:0;color:#e9c46a;font-size:24px;font-weight:800;letter-spacing:0.5px;">CATCH<span style="color:#fefae0;">DADDY</span></h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px 28px;">
            <h2 style="color:#1b4332;font-size:22px;margin:0 0 16px;">You're on the list!</h2>
            <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 20px;">Thanks for signing up for CatchDaddy — we're stoked to have you. Here's what you're getting into:</p>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
              <tr>
                <td style="padding:16px;background:#f0faf4;border-radius:10px;border-left:4px solid #2d6a4f;margin-bottom:12px;">
                  <p style="margin:0 0 4px;font-weight:700;color:#1b4332;font-size:15px;">Your data stays yours.</p>
                  <p style="margin:0;color:#555;font-size:14px;line-height:1.5;">Your catches, spots, and fishing logs are private by default. We never sell your data or share your locations. You choose what to share and with whom.</p>
                </td>
              </tr>
              <tr><td style="height:12px;"></td></tr>
              <tr>
                <td style="padding:16px;background:#fef9ef;border-radius:10px;border-left:4px solid #e9c46a;">
                  <p style="margin:0 0 4px;font-weight:700;color:#1b4332;font-size:15px;">AI that actually helps you fish.</p>
                  <p style="margin:0;color:#555;font-size:14px;line-height:1.5;">Snap a photo and instantly ID any fish species or lure. Get AI-powered local fishing guides, lure recommendations based on conditions, and smart trip planning — all tailored to where you fish.</p>
                </td>
              </tr>
              <tr><td style="height:12px;"></td></tr>
              <tr>
                <td style="padding:16px;background:#f0faf4;border-radius:10px;border-left:4px solid #2d6a4f;">
                  <p style="margin:0 0 4px;font-weight:700;color:#1b4332;font-size:15px;">Plus so much more.</p>
                  <p style="margin:0;color:#555;font-size:14px;line-height:1.5;">Real-time stocking schedules, weather forecasts, community challenges, and more.</p>
                </td>
              </tr>
            </table>

            <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 24px;">We'll hit your inbox once when we launch — no spam, ever.</p>

            <p style="margin:0 0 4px;color:#1b4332;font-weight:700;font-size:15px;">Tight lines,</p>
            <p style="margin:0;color:#555;font-size:15px;">The CatchDaddy Team</p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#1b4332;padding:20px 24px;text-align:center;">
            <a href="https://catchdaddy.net" style="color:#e9c46a;font-size:14px;font-weight:600;text-decoration:none;">catchdaddy.net</a>
            <p style="margin:8px 0 0;color:#74c69d;font-size:12px;">Questions? Reply to this email or reach us at support@catchdaddy.net</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

        // Confirmation to subscriber
        await transporter.sendMail({
          from: `"CatchDaddy" <${process.env.SMTP_USER}>`,
          to: trimmed,
          subject: "You're on the list — CatchDaddy is coming soon",
          text: "Thanks for signing up for CatchDaddy! We'll let you know when we launch. Your data stays private, and our AI helps you fish smarter. Tight lines, The CatchDaddy Team — catchdaddy.net",
          html: confirmHtml,
        });

        // Notify admin
        await transporter.sendMail({
          from: `"CatchDaddy" <${process.env.SMTP_USER}>`,
          to: 'support@catchdaddy.net',
          subject: `New subscriber: ${trimmed}`,
          text: `New email signup from ${req.body.source || 'landing'} page:\n\n${trimmed}`,
        });
      } catch (mailErr) {
        // Don't fail the request if email fails
        console.error('Email send failed:', mailErr.message);
      }

      res.json({ ok: true, message: 'Subscribed' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to subscribe' });
    }
  }
);

const SPECIES_MAP = {
  'RAINBOW': 'Rainbow Trout',
  'RAINBOW TROUT': 'Rainbow Trout',
  'BROWN TROUT': 'Brown Trout',
  'BROOK TROUT': 'Brook Trout',
  'CUTTHROAT': 'Cutthroat Trout',
  'CUTTHROAT TROUT': 'Cutthroat Trout',
  'BEAR LAKE CUTTHROAT': 'Bear Lake Cutthroat',
  'BONNEVILLE CUTTHROAT': 'Bonneville Cutthroat',
  'CUTBOW': 'Cutbow Trout',
  'TIGER TROUT': 'Tiger Trout',
  'TIGER MUSKIE': 'Tiger Muskie',
  'SPLAKE': 'Splake',
  'KOKANEE': 'Kokanee Salmon',
  'KOKANEE SALMON': 'Kokanee Salmon',
  'LARGEMOUTH BASS': 'Largemouth Bass',
  'SMALLMOUTH BASS': 'Smallmouth Bass',
  'CHANNEL CATFISH': 'Channel Catfish',
  'BLUEGILL': 'Bluegill',
  'WALLEYE': 'Walleye',
  'WIPER': 'Wiper',
  'LAKE TROUT': 'Lake Trout',
  'ALBINO TROUT': 'Albino Trout',
  'CHUB': 'Chub',
};

function normalizeSpecies(raw) {
  const upper = (raw || '').trim().toUpperCase();
  if (SPECIES_MAP[upper]) return SPECIES_MAP[upper];
  // Strip DWR stock codes like "CUTBOW CTBL*RTWV" → try matching base word
  const base = upper.split(/\s+/)[0];
  if (SPECIES_MAP[base]) return SPECIES_MAP[base];
  return raw.trim();
}

/**
 * Parse bare <tr> rows from Utah DWR AJAX response.
 * Each row has 6 <td> cells: water, county, species, quantity, length, date
 */
function parseRows(html) {
  const entries = [];
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;

  let trMatch;
  while ((trMatch = trRegex.exec(html)) !== null) {
    const rowHtml = trMatch[1];
    const cells = [];
    let tdMatch;
    tdRegex.lastIndex = 0;
    while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
      cells.push(tdMatch[1].replace(/<[^>]*>/g, '').trim());
    }
    if (cells.length < 6) continue;

    const waterBody = cells[0];
    const county = cells[1];
    const species = normalizeSpecies(cells[2]);
    const quantity = parseInt(cells[3].replace(/,/g, ''), 10) || 0;
    const length = cells[4];
    const date = cells[5]; // MM/DD/YYYY

    if (!waterBody || !date) continue;

    entries.push({ waterBody, county, species, quantity, length, date });
  }

  return entries;
}

exports.utahStocking = onRequest(
  { cors: true, region: 'us-west1' },
  async (req, res) => {
    const year = req.query.y || new Date().getFullYear();
    const url = `https://dwrapps.utah.gov/fishstocking/FishAjax?y=${encodeURIComponent(year)}&sort=date&sortorder=desc`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        res.status(502).json({ error: `DWR returned ${response.status}` });
        return;
      }

      const html = await response.text();
      const entries = parseRows(html);

      res.set('Cache-Control', 'public, max-age=86400');
      res.json(entries);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

exports.idahoStocking = onRequest(
  { cors: true, region: 'us-west1' },
  async (req, res) => {
    const url =
      'https://idfg.idaho.gov/ifwis/fishingplanner/api/2.0/stocking/?limit=2000&sort=stocked&order=desc';

    try {
      const response = await fetch(url);
      if (!response.ok) {
        res.status(502).json({ error: `IDFG returned ${response.status}` });
        return;
      }

      const data = await response.json();
      const rows = data.rows || [];

      const entries = rows
        .filter((r) => r.name && r.stocked)
        .map((r) => ({
          waterBody: r.name,
          county: r.loc || '',
          species: r.spp || '',
          quantity: parseInt(r.n, 10) || 0,
          length: r.len || '',
          date: r.stocked,
        }));

      res.set('Cache-Control', 'public, max-age=86400');
      res.json(entries);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);
