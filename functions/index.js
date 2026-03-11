const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// ── Per-user rate limiting ──
const rateLimitCache = new Map(); // { uid: { count, windowStart } }
const RATE_WINDOW_MS = 60 * 1000; // 1 minute window

function isRateLimited(uid, maxPerMinute) {
  const now = Date.now();
  const entry = rateLimitCache.get(uid);
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    rateLimitCache.set(uid, { count: 1, windowStart: now });
    return false;
  }
  entry.count++;
  if (entry.count > maxPerMinute) return true;
  return false;
}

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [uid, entry] of rateLimitCache) {
    if (now - entry.windowStart > RATE_WINDOW_MS * 2) rateLimitCache.delete(uid);
  }
}, 5 * 60 * 1000);

// ── Input validation helpers ──
const MAX_BODY_SIZE = 1024 * 1024; // 1MB max for Gemini requests (images)
const MAX_TEXT_QUERY_LEN = 500;

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

    // Rate limit: 15 Gemini requests per minute per user
    if (isRateLimited(user.uid, 15)) {
      res.status(429).json({ error: 'Rate limit exceeded. Please wait a minute and try again.' });
      return;
    }

    // Validate request body structure
    const body = req.body;
    if (!body || !body.contents || !Array.isArray(body.contents)) {
      res.status(400).json({ error: 'Invalid request: contents array is required' });
      return;
    }

    // Check body size (serialized)
    const bodyStr = JSON.stringify(body);
    if (bodyStr.length > MAX_BODY_SIZE) {
      res.status(413).json({ error: 'Request too large' });
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
        body: bodyStr,
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

    // Rate limit: 10 Places requests per minute per user
    if (isRateLimited(user.uid, 10)) {
      res.status(429).json({ error: 'Rate limit exceeded. Please wait a minute and try again.' });
      return;
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'Places API key not configured on server' });
      return;
    }

    const { textQuery, maxResultCount, fieldMask } = req.body;
    if (!textQuery || typeof textQuery !== 'string') {
      res.status(400).json({ error: 'textQuery is required' });
      return;
    }
    if (textQuery.length > MAX_TEXT_QUERY_LEN) {
      res.status(400).json({ error: 'textQuery too long' });
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
        body: JSON.stringify({ textQuery, maxResultCount: Math.min(maxResultCount || 5, 10) }),
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

/**
 * Proxy Oregon ODFW trout stocking schedule.
 * Fetches the print-friendly HTML table and returns parsed JSON.
 */
exports.oregonStocking = onRequest(
  { cors: true, region: 'us-west1' },
  async (req, res) => {
    const url = 'https://myodfw.com/fishing/species/trout/stocking-schedule-print';

    try {
      const response = await fetch(url);
      if (!response.ok) {
        res.status(502).json({ error: `ODFW returned ${response.status}` });
        return;
      }

      const html = await response.text();
      const entries = parseOregonTable(html);

      res.set('Cache-Control', 'public, max-age=86400');
      res.json(entries);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * Proxy Virginia DWR trout stocking schedule.
 * Fetches the HTML table from the stocking schedule page.
 */
exports.virginiaStocking = onRequest(
  { cors: true, region: 'us-west1' },
  async (req, res) => {
    const url = 'https://dwr.virginia.gov/fishing/trout-stocking-schedule/';

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CatchDaddy/1.0)' },
      });
      if (!response.ok) {
        res.status(502).json({ error: `VA DWR returned ${response.status}` });
        return;
      }

      const html = await response.text();
      const entries = parseVirginiaTable(html);

      res.set('Cache-Control', 'public, max-age=86400');
      res.json(entries);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

function parseVirginiaTable(html) {
  const entries = [];
  // Find the stocking table
  const tableMatch = html.match(/<table[^>]*id=["']stocking-table["'][^>]*>([\s\S]*?)<\/table>/i)
    || html.match(/<table[^>]*>([\s\S]*?)<\/table>/i);
  if (!tableMatch) return entries;

  const tableHtml = tableMatch[1];
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;

  let trMatch;
  while ((trMatch = trRegex.exec(tableHtml)) !== null) {
    const rowHtml = trMatch[1];
    if (rowHtml.includes('<th')) continue; // skip header rows

    const cells = [];
    let tdMatch;
    tdRegex.lastIndex = 0;
    while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
      cells.push(tdMatch[1].replace(/<[^>]*>/g, '').trim());
    }

    if (cells.length < 3) continue;

    // VA table typically has: Date, Water, County, Species, Category
    const date = cells[0];
    const waterBody = cells[1];
    const county = cells[2] || '';
    const species = cells[3] || 'Trout';

    if (!waterBody || !date) continue;

    // Normalize date to MM/DD/YYYY
    let normalizedDate = date;
    const dateMatch = date.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dateMatch) {
      normalizedDate = `${dateMatch[1].padStart(2, '0')}/${dateMatch[2].padStart(2, '0')}/${dateMatch[3]}`;
    }

    entries.push({
      waterBody,
      county,
      species,
      quantity: 0,
      length: '',
      date: normalizedDate,
    });
  }

  return entries;
}

/**
 * Proxy Montana FWP fish stocking data.
 * Fetches from their plantsearchgrid JSON API.
 */
exports.montanaStocking = onRequest(
  { cors: true, region: 'us-west1' },
  async (req, res) => {
    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const fmt = (d) =>
      `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}-${String(d.getFullYear()).slice(-2)}`;

    const url = 'https://myfwp.mt.gov/fishMT/plants/plantsearchgrid';

    try {
      const params = new URLSearchParams();
      params.append('startDate', fmt(sixMonthsAgo));
      params.append('endDate', fmt(now));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (compatible; CatchDaddy/1.0)',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        res.status(502).json({ error: `MT FWP returned ${response.status}` });
        return;
      }

      const data = await response.json();
      const rows = data.data || [];

      const entries = rows
        .filter((r) => r.waterName && r.datePlanted)
        .map((r) => ({
          waterBody: r.waterName,
          county: r.county || r.region || '',
          species: r.speciesName || r.strainName || 'Trout',
          quantity: parseInt(r.fishCount, 10) || 0,
          length: r.fishSize || '',
          date: r.datePlanted,
        }));

      res.set('Cache-Control', 'public, max-age=86400');
      res.json(entries);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * Proxy Michigan DNR fish stocking data.
 * Fetches from their GetFishTable JSON API.
 */
exports.michiganStocking = onRequest(
  { cors: true, region: 'us-west1' },
  async (req, res) => {
    const now = new Date();
    const year = now.getFullYear();
    const url = 'https://www2.dnr.state.mi.us/fishstock/FishStock/Default/GetFishTable';

    try {
      const params = new URLSearchParams();
      params.append('County', '');
      params.append('WaterBody', '');
      params.append('Species', '');
      params.append('StartMonth', '1');
      params.append('StartYear', String(year));
      params.append('EndMonth', String(now.getMonth() + 1));
      params.append('EndYear', String(year));
      params.append('OrderBy', 'Stock Date');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (compatible; CatchDaddy/1.0)',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        res.status(502).json({ error: `MI DNR returned ${response.status}` });
        return;
      }

      const html = await response.text();
      const entries = parseMichiganTable(html);

      res.set('Cache-Control', 'public, max-age=86400');
      res.json(entries);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

function parseMichiganTable(html) {
  const entries = [];
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;

  let trMatch;
  while ((trMatch = trRegex.exec(html)) !== null) {
    const rowHtml = trMatch[1];
    if (rowHtml.includes('<th')) continue;

    const cells = [];
    let tdMatch;
    tdRegex.lastIndex = 0;
    while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
      cells.push(tdMatch[1].replace(/<[^>]*>/g, '').trim());
    }

    if (cells.length < 4) continue;

    // MI table: County, Water Body, Species, Strain, Stock Date, Number, Avg Length
    const county = cells[0] || '';
    const waterBody = cells[1] || '';
    const species = cells[2] || '';
    const date = cells[4] || '';
    const quantity = parseInt((cells[5] || '0').replace(/,/g, ''), 10) || 0;
    const length = cells[6] || '';

    if (!waterBody || !date) continue;

    // Normalize date
    let normalizedDate = date;
    const dateMatch = date.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dateMatch) {
      normalizedDate = `${dateMatch[1].padStart(2, '0')}/${dateMatch[2].padStart(2, '0')}/${dateMatch[3]}`;
    }

    entries.push({
      waterBody,
      county,
      species,
      quantity,
      length,
      date: normalizedDate,
    });
  }

  return entries;
}

/**
 * Proxy Wisconsin DNR fish stocking data.
 * Fetches from their LoadResults JSON API.
 */
exports.wisconsinStocking = onRequest(
  { cors: true, region: 'us-west1' },
  async (req, res) => {
    const year = new Date().getFullYear();
    const url =
      'https://apps.dnr.wi.gov/fisheriesmanagement/Public/Summary/LoadResults';

    try {
      const params = new URLSearchParams();
      params.append('STOCKING_YEAR', String(year));
      params.append('SPECIES_NAME', '');
      params.append('COUNTY_CODE', '');
      params.append('STOCKED_WB_NAME', '');
      params.append('LOCAL_WB_NAME', '');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (compatible; CatchDaddy/1.0)',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        res.status(502).json({ error: `WI DNR returned ${response.status}` });
        return;
      }

      const html = await response.text();
      const entries = parseWisconsinTable(html);

      res.set('Cache-Control', 'public, max-age=86400');
      res.json(entries);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

function parseWisconsinTable(html) {
  const entries = [];
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;

  let trMatch;
  while ((trMatch = trRegex.exec(html)) !== null) {
    const rowHtml = trMatch[1];
    if (rowHtml.includes('<th')) continue;

    const cells = [];
    let tdMatch;
    tdRegex.lastIndex = 0;
    while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
      cells.push(tdMatch[1].replace(/<[^>]*>/g, '').trim());
    }

    if (cells.length < 4) continue;

    // WI table: County, Waterbody, Species, Strain, Stock Date, Number, Avg Size
    const county = cells[0] || '';
    const waterBody = cells[1] || '';
    const species = cells[2] || '';
    const date = cells[4] || '';
    const quantity = parseInt((cells[5] || '0').replace(/,/g, ''), 10) || 0;
    const length = cells[6] || '';

    if (!waterBody || !date) continue;

    let normalizedDate = date;
    const dateMatch = date.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dateMatch) {
      normalizedDate = `${dateMatch[1].padStart(2, '0')}/${dateMatch[2].padStart(2, '0')}/${dateMatch[3]}`;
    }

    entries.push({
      waterBody,
      county,
      species,
      quantity,
      length,
      date: normalizedDate,
    });
  }

  return entries;
}

/**
 * Proxy North Carolina NCWRC trout stocking schedule.
 * Fetches HTML table from ncpaws.org OnlineSchedule page.
 */
exports.ncStocking = onRequest(
  { cors: true, region: 'us-west1' },
  async (req, res) => {
    const url =
      'https://ncpaws.org/PAWS/Fish/Stocking/Schedule/OnlineSchedule.aspx';

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CatchDaddy/1.0)' },
      });
      if (!response.ok) {
        res.status(502).json({ error: `NCWRC returned ${response.status}` });
        return;
      }

      const html = await response.text();
      const entries = parseNcTable(html);

      res.set('Cache-Control', 'public, max-age=86400');
      res.json(entries);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

function parseNcTable(html) {
  const entries = [];
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;

  let trMatch;
  while ((trMatch = trRegex.exec(html)) !== null) {
    const rowHtml = trMatch[1];
    if (rowHtml.includes('<th')) continue;

    const cells = [];
    let tdMatch;
    tdRegex.lastIndex = 0;
    while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
      cells.push(tdMatch[1].replace(/<[^>]*>/g, '').trim());
    }

    if (cells.length < 2) continue;

    // NC table: County, Stream, Classification (e.g. "Delayed Harvest"), Date
    const county = cells[0] || '';
    const waterBody = cells[1] || '';
    const classification = cells[2] || '';
    const dateRaw = cells[3] || '';

    if (!waterBody) continue;

    // Try to extract date, may be in various formats
    let date = '';
    const dateMatch = dateRaw.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (dateMatch) {
      const yr =
        dateMatch[3].length === 2 ? '20' + dateMatch[3] : dateMatch[3];
      date = `${dateMatch[1].padStart(2, '0')}/${dateMatch[2].padStart(2, '0')}/${yr}`;
    } else {
      // Use today if no date column
      const now = new Date();
      date = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()}`;
    }

    entries.push({
      waterBody,
      county,
      species: 'Trout',
      quantity: 0,
      length: '',
      date,
      classification,
    });
  }

  return entries;
}

/**
 * Proxy Tennessee TWRA trout stocking schedule.
 * Fetches HTML tables from the TWRA stocking page.
 */
exports.tennesseeStocking = onRequest(
  { cors: true, region: 'us-west1' },
  async (req, res) => {
    const url =
      'https://www.tn.gov/twra/fishing/trout-information-stockings.html';

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CatchDaddy/1.0)' },
      });
      if (!response.ok) {
        res.status(502).json({ error: `TWRA returned ${response.status}` });
        return;
      }

      const html = await response.text();
      const entries = parseTennesseeTable(html);

      res.set('Cache-Control', 'public, max-age=86400');
      res.json(entries);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

function parseTennesseeTable(html) {
  const entries = [];
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;

  let trMatch;
  while ((trMatch = trRegex.exec(html)) !== null) {
    const rowHtml = trMatch[1];
    if (rowHtml.includes('<th')) continue;

    const cells = [];
    let tdMatch;
    tdRegex.lastIndex = 0;
    while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
      cells.push(tdMatch[1].replace(/<[^>]*>/g, '').trim());
    }

    if (cells.length < 3) continue;

    // TN table: Destination, County, Region, Stocking Type, Species, Months/Date
    const waterBody = cells[0] || '';
    const county = cells[1] || '';
    const region = cells[2] || '';
    const stockingType = cells[3] || '';
    const species = cells[4] || 'Trout';
    const dateInfo = cells[5] || cells[cells.length - 1] || '';

    if (!waterBody) continue;

    // Try to parse date; TN may list months or specific dates
    let date = '';
    const dateMatch = dateInfo.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (dateMatch) {
      const yr =
        dateMatch[3].length === 2 ? '20' + dateMatch[3] : dateMatch[3];
      date = `${dateMatch[1].padStart(2, '0')}/${dateMatch[2].padStart(2, '0')}/${yr}`;
    } else {
      // Use current date as fallback for schedule-type entries
      const now = new Date();
      date = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()}`;
    }

    entries.push({
      waterBody,
      county,
      species,
      quantity: 0,
      length: '',
      date,
      region,
      stockingType,
    });
  }

  return entries;
}

/**
 * Proxy California CDFW fish planting data.
 * Fetches the default results page from nrm.dfg.ca.gov/fishplants.
 */
exports.californiaStocking = onRequest(
  { cors: true, region: 'us-west1' },
  async (req, res) => {
    const url = 'https://nrm.dfg.ca.gov/fishplants/Default.aspx';

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CatchDaddy/1.0)' },
      });
      if (!response.ok) {
        res.status(502).json({ error: `CDFW returned ${response.status}` });
        return;
      }

      const html = await response.text();
      const entries = parseCaliforniaTable(html);

      res.set('Cache-Control', 'public, max-age=86400');
      res.json(entries);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

function parseCaliforniaTable(html) {
  const entries = [];
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;

  let trMatch;
  while ((trMatch = trRegex.exec(html)) !== null) {
    const rowHtml = trMatch[1];
    if (rowHtml.includes('<th')) continue;

    const cells = [];
    let tdMatch;
    tdRegex.lastIndex = 0;
    while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
      cells.push(tdMatch[1].replace(/<[^>]*>/g, '').trim());
    }

    if (cells.length < 3) continue;

    // CA table: Week of, Water Body, County, Species
    const weekOf = cells[0] || '';
    const waterBody = cells[1] || '';
    const county = cells[2] || '';
    const species = cells[3] || 'Trout';

    if (!waterBody) continue;

    // Parse date range like "03/03 - 03/09" or "March 3-9, 2026"
    let date = '';
    const slashDate = weekOf.match(/(\d{1,2})\/(\d{1,2})/);
    const fullDate = weekOf.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (fullDate) {
      date = `${fullDate[1].padStart(2, '0')}/${fullDate[2].padStart(2, '0')}/${fullDate[3]}`;
    } else if (slashDate) {
      date = `${slashDate[1].padStart(2, '0')}/${slashDate[2].padStart(2, '0')}/${new Date().getFullYear()}`;
    } else {
      const now = new Date();
      date = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()}`;
    }

    entries.push({
      waterBody,
      county,
      species,
      quantity: 0,
      length: '',
      date,
    });
  }

  return entries;
}

/**
 * Proxy West Virginia DNR fish stocking data.
 * Fetches the daily stocking page and parses the update list.
 */
exports.wvStocking = onRequest(
  { cors: true, region: 'us-west1' },
  async (req, res) => {
    const url = 'https://wvdnr.gov/fishing/fish-stocking/';

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CatchDaddy/1.0)' },
      });
      if (!response.ok) {
        res.status(502).json({ error: `WVDNR returned ${response.status}` });
        return;
      }

      const html = await response.text();
      const entries = parseWvStocking(html);

      res.set('Cache-Control', 'public, max-age=86400');
      res.json(entries);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

function parseWvStocking(html) {
  const entries = [];

  // WV posts daily updates in paragraphs/lists with water names and dates
  // Look for date headers and water body lists
  const dateHeaderRegex =
    /(?:<h[2-4][^>]*>|<strong>|<b>)\s*((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s*\d{4})\s*(?:<\/h[2-4]>|<\/strong>|<\/b>)/gi;
  const listItemRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;

  // Also try table format
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;

  // Try table parsing first
  let trMatch;
  while ((trMatch = trRegex.exec(html)) !== null) {
    const rowHtml = trMatch[1];
    if (rowHtml.includes('<th')) continue;

    const cells = [];
    let tdMatch;
    tdRegex.lastIndex = 0;
    while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
      cells.push(tdMatch[1].replace(/<[^>]*>/g, '').trim());
    }

    if (cells.length >= 2) {
      const waterBody = cells[0] || '';
      const county = cells[1] || '';
      const species = cells[2] || 'Trout';
      const dateRaw = cells[3] || '';

      if (!waterBody) continue;

      let date = '';
      const dm = dateRaw.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
      if (dm) {
        const yr = dm[3].length === 2 ? '20' + dm[3] : dm[3];
        date = `${dm[1].padStart(2, '0')}/${dm[2].padStart(2, '0')}/${yr}`;
      } else {
        const now = new Date();
        date = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()}`;
      }

      entries.push({ waterBody, county, species, quantity: 0, length: '', date });
    }
  }

  // If no table data, try list items with date context
  if (entries.length === 0) {
    let currentDate = '';
    let dateMatch;
    const monthMap = {
      january: '01', february: '02', march: '03', april: '04',
      may: '05', june: '06', july: '07', august: '08',
      september: '09', october: '10', november: '11', december: '12',
    };

    while ((dateMatch = dateHeaderRegex.exec(html)) !== null) {
      const raw = dateMatch[1];
      const parts = raw.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s*(\d{4})/i);
      if (parts) {
        const mm = monthMap[parts[1].toLowerCase()];
        currentDate = `${mm}/${parts[2].padStart(2, '0')}/${parts[3]}`;
      }
    }

    // Fall back to today if no date headers found
    if (!currentDate) {
      const now = new Date();
      currentDate = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()}`;
    }

    let liMatch;
    while ((liMatch = listItemRegex.exec(html)) !== null) {
      const text = liMatch[1].replace(/<[^>]*>/g, '').trim();
      if (text.length > 3 && !text.toLowerCase().includes('click') && !text.toLowerCase().includes('hotline')) {
        entries.push({
          waterBody: text,
          county: '',
          species: 'Trout',
          quantity: 0,
          length: '',
          date: currentDate,
        });
      }
    }
  }

  return entries;
}

function parseOregonTable(html) {
  const entries = [];
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;

  let trMatch;
  let headerFound = false;
  while ((trMatch = trRegex.exec(html)) !== null) {
    const rowHtml = trMatch[1];
    const cells = [];
    let cellMatch;
    cellRegex.lastIndex = 0;
    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      cells.push(cellMatch[1].replace(/<[^>]*>/g, '').trim());
    }

    // Skip until we find the header row
    if (!headerFound) {
      if (cells.some((c) => c.toLowerCase().includes('week of'))) {
        headerFound = true;
      }
      continue;
    }

    if (cells.length < 5) continue;

    // Columns: Week of, Waterbody, Zone/Office, Legals, Trophy, Brood, Fingerling, Total
    const weekOf = cells[0];
    const waterBody = cells[1];
    const region = cells[2];
    const total = parseInt((cells[cells.length - 1] || '0').replace(/,/g, ''), 10) || 0;

    if (!waterBody || !weekOf) continue;

    // Parse "Mar. 09-13, 2026"
    const dateMatch = weekOf.match(/(\w+)\.?\s+(\d+)-\d+,?\s*(\d{4})/);
    let date = '';
    if (dateMatch) {
      const monthAbbr = dateMatch[1].toLowerCase();
      const monthMap = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
      const mm = monthMap[monthAbbr] || '01';
      const dd = dateMatch[2].padStart(2, '0');
      date = `${mm}/${dd}/${dateMatch[3]}`;
    }

    if (!date) continue;

    entries.push({
      waterBody,
      county: region,
      species: 'Trout',
      quantity: total,
      length: '',
      date,
    });
  }

  return entries;
}
