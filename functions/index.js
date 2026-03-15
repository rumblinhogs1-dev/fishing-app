const { onRequest } = require('firebase-functions/v2/https');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// ── CORS configuration ──
const ALLOWED_ORIGINS = ['https://catchdaddy.net', 'https://www.catchdaddy.net'];

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

// IP-based rate limiting for unauthenticated endpoints
function isIpRateLimited(req, maxPerMinute) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';
  return isRateLimited(`ip:${ip}`, maxPerMinute);
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
  { cors: ALLOWED_ORIGINS, region: 'us-west1', maxInstances: 20 },
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
  { cors: ALLOWED_ORIGINS, region: 'us-west1', maxInstances: 10 },
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
  { cors: ALLOWED_ORIGINS, region: 'us-west1', maxInstances: 5 },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Rate limit: 5 subscribe attempts per minute per IP
    if (isIpRateLimited(req, 5)) {
      res.status(429).json({ error: 'Too many requests. Please try again later.' });
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
  { cors: ALLOWED_ORIGINS, region: 'us-west1' },
  async (req, res) => {
    const rawYear = req.query.y || String(new Date().getFullYear());
    const year = /^\d{4}$/.test(rawYear) ? rawYear : String(new Date().getFullYear());
    const url = `https://dwrapps.utah.gov/fishstocking/FishAjax?y=${year}&sort=date&sortorder=desc`;

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
  { cors: ALLOWED_ORIGINS, region: 'us-west1' },
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
  { cors: ALLOWED_ORIGINS, region: 'us-west1' },
  async (req, res) => {
    const year = new Date().getFullYear();
    const url = `https://myodfw.com/fishing/species/trout/stocking-schedule-print?field_planned_stocking_date_value=${year}-01-01&field_planned_stocking_date_end_value=${year}-12-31`;

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
      });
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
  { cors: ALLOWED_ORIGINS, region: 'us-west1' },
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
  { cors: ALLOWED_ORIGINS, region: 'us-west1' },
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
        .filter((r) => r.waterName && r.hpDatePlanted)
        .map((r) => {
          // Parse "Dec 15, 2025" → "12/15/2025"
          let date = '';
          const monthMap = {
            jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
            jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
          };
          const dm = (r.hpDatePlanted || '').match(/(\w{3})\s+(\d{1,2}),?\s*(\d{4})/);
          if (dm) {
            date = `${monthMap[dm[1].toLowerCase()] || '01'}/${dm[2].padStart(2, '0')}/${dm[3]}`;
          }

          return {
            waterBody: r.waterName,
            county: r.countyNames || r.hpPlantRegion || '',
            species: r.fslName || r.hssStrainName || 'Trout',
            quantity: parseInt(r.hpNumFish, 10) || 0,
            length: r.hpFishSize || '',
            date,
          };
        })
        .filter((e) => e.date);

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
  { cors: ALLOWED_ORIGINS, region: 'us-west1' },
  async (req, res) => {
    const now = new Date();
    const year = now.getFullYear();
    const baseUrl = 'https://www2.dnr.state.mi.us/FishStock/Default/GetFishTable';

    try {
      const params = new URLSearchParams({
        sCounty: 'All',
        sWaterBody: 'All',
        sSpecies: 'All',
        sStrain: 'All',
        intStartMonth: '1',
        intStartYear: String(year),
        intEndMonth: String(now.getMonth() + 1),
        intEndYear: String(year),
        sOrder: 'STOCKDATE',
        bExport: '0',
      });

      const response = await fetch(`${baseUrl}?${params}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        res.status(502).json({ error: `MI DNR returned ${response.status}` });
        return;
      }

      const json = await response.json();
      const entries = json.map((r) => {
        let date = '';
        if (r.Date) {
          const parts = r.Date.split('/');
          if (parts.length === 3) {
            date = `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2].length === 2 ? '20' + parts[2] : parts[2]}`;
          }
        }
        return {
          waterBody: r.WaterName || '',
          county: r.CountyName || '',
          species: r.SpeciesName || '',
          quantity: parseInt(String(r.Number || '0').replace(/,/g, ''), 10) || 0,
          length: r.Length || '',
          date,
        };
      }).filter((e) => e.waterBody && e.date);

      res.set('Cache-Control', 'public, max-age=86400');
      res.json(entries);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * Proxy Wisconsin DNR fish stocking data.
 * Fetches from their LoadResults JSON API.
 */
exports.wisconsinStocking = onRequest(
  { cors: ALLOWED_ORIGINS, region: 'us-west1' },
  async (req, res) => {
    const url =
      'https://apps.dnr.wi.gov/fisheriesmanagement/Public/Summary/LoadResults';

    async function fetchYear(yr) {
      const params = new URLSearchParams();
      params.append('draw', '1');
      params.append('start', '0');
      params.append('length', '10000');
      params.append('STOCKING_YEAR', String(yr));
      params.append('SPECIES_NAME', '');
      params.append('COUNTY_CODE', '');
      params.append('STOCKED_WB_NAME', '');
      params.append('LOCAL_WB_NAME', '');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (compatible; CatchDaddy/1.0)',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: params.toString(),
      });
      if (!response.ok) return [];
      const json = await response.json();
      return json.data || [];
    }

    try {
      const year = new Date().getFullYear();
      let rows = await fetchYear(year);
      let usedYear = year;
      if (rows.length === 0) {
        rows = await fetchYear(year - 1);
        usedYear = year - 1;
      }

      const dateStr = `06/01/${usedYear}`;

      const entries = rows
        .filter((r) => r.STOCKED_WB_NAME)
        .map((r) => ({
          waterBody: r.STOCKED_WB_NAME || r.LOCAL_WB_NAME || '',
          county: r.STOCKED_COUNTY_NAME || '',
          species: r.SPECIES_NAME || 'Fish',
          quantity: parseInt(r.SUM_FISH_STOCKED_NUMBER, 10) || 0,
          length: r.AVERAGE_FISH_LENGTH_INCHES ? `${r.AVERAGE_FISH_LENGTH_INCHES} in` : '',
          date: dateStr,
        }));

      res.set('Cache-Control', 'public, max-age=86400');
      res.json(entries);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * Proxy North Carolina NCWRC trout stocking schedule.
 * Fetches HTML table from ncpaws.org OnlineSchedule page.
 */
exports.ncStocking = onRequest(
  { cors: ALLOWED_ORIGINS, region: 'us-west1' },
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
  { cors: ALLOWED_ORIGINS, region: 'us-west1' },
  async (req, res) => {
    const scheduleUrl = 'https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json';
    const reportUrl = 'https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable.exceldriven.json';

    try {
      const [schedResp, reportResp] = await Promise.allSettled([
        fetch(scheduleUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CatchDaddy/1.0)' } }),
        fetch(reportUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CatchDaddy/1.0)' } }),
      ]);

      const entries = [];

      // Parse schedule data (has STOCKING WEEK dates)
      if (schedResp.status === 'fulfilled' && schedResp.value.ok) {
        const schedJson = await schedResp.value.json();
        const rows = schedJson.data || schedJson;
        for (const r of rows) {
          const waterBody = r.LOCATION || '';
          if (!waterBody) continue;
          const dateStr = r['STOCKING WEEK'] || r['STOCKING DAY'] || '';
          let date = '';
          const dm = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
          if (dm) {
            date = `${dm[1].padStart(2, '0')}/${dm[2].padStart(2, '0')}/${dm[3]}`;
          }
          if (!date) continue;
          entries.push({
            waterBody,
            county: r.COUNTY || '',
            species: r.SPECIES || 'Trout',
            quantity: 0,
            length: '',
            date,
            region: r.REGION || '',
            stockingType: r.TYPE || '',
          });
        }
      }

      // Parse stocking report (recent actual stockings)
      if (reportResp.status === 'fulfilled' && reportResp.value.ok) {
        const reportJson = await reportResp.value.json();
        const rows = reportJson.data || reportJson;
        for (const r of rows) {
          const waterBody = r.Destination || '';
          if (!waterBody) continue;
          const dateStr = r['Stocking Date'] || '';
          let date = '';
          const dm = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
          if (dm) {
            date = `${dm[1].padStart(2, '0')}/${dm[2].padStart(2, '0')}/${dm[3]}`;
          }
          if (!date) continue;
          entries.push({
            waterBody,
            county: '',
            species: 'Trout',
            quantity: 0,
            length: '',
            date,
            region: r.Region || '',
          });
        }
      }

      res.set('Cache-Control', 'public, max-age=86400');
      res.json(entries);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * Proxy California CDFW fish planting data.
 * Fetches the default results page from nrm.dfg.ca.gov/fishplants.
 */
exports.californiaStocking = onRequest(
  { cors: ALLOWED_ORIGINS, region: 'us-west1' },
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
  { cors: ALLOWED_ORIGINS, region: 'us-west1' },
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

/**
 * Proxy Maryland DNR trout stocking data.
 * Fetches from their clean JSON REST API.
 */
exports.marylandStocking = onRequest(
  { cors: ALLOWED_ORIGINS, region: 'us-west1' },
  async (req, res) => {
    const url =
      'https://webapps02.dnr.state.md.us/DNRTroutStockingAPI/api/RecentStockings';

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CatchDaddy/1.0)' },
      });
      if (!response.ok) {
        res.status(502).json({ error: `MD DNR returned ${response.status}` });
        return;
      }

      const data = await response.json();
      const entries = (Array.isArray(data) ? data : [])
        .filter((r) => r.LOCATION && r.ActivityDate)
        .map((r) => {
          // ActivityDate: "2026-03-10T00:00:00" → "03/10/2026"
          let date = '';
          const dm = (r.ActivityDate || '').match(/(\d{4})-(\d{2})-(\d{2})/);
          if (dm) date = `${dm[2]}/${dm[3]}/${dm[1]}`;

          return {
            waterBody: r.LOCATION,
            county: r.County || '',
            species: r.Species || 'Trout',
            quantity: parseInt(r.NumOfFish, 10) || 0,
            length: '',
            date,
          };
        });

      res.set('Cache-Control', 'public, max-age=86400');
      res.json(entries);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * Proxy South Carolina DNR trout stocking data.
 * Fetches the stocking results HTML table.
 */
exports.scStocking = onRequest(
  { cors: ALLOWED_ORIGINS, region: 'us-west1' },
  async (req, res) => {
    const url = 'https://www.dnr.sc.gov/fish/stocking/results.html';

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CatchDaddy/1.0)' },
      });
      if (!response.ok) {
        res.status(502).json({ error: `SC DNR returned ${response.status}` });
        return;
      }

      const html = await response.text();
      const entries = parseScTable(html);

      res.set('Cache-Control', 'public, max-age=86400');
      res.json(entries);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

function parseScTable(html) {
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

    // SC table: Day (date), River/Lake, Total count
    const dateRaw = cells[0] || '';
    const waterBody = cells[1] || '';
    const quantity =
      parseInt((cells[2] || '0').replace(/,/g, ''), 10) || 0;

    if (!waterBody) continue;

    let date = '';
    const dm = dateRaw.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (dm) {
      const yr = dm[3].length === 2 ? '20' + dm[3] : dm[3];
      date = `${dm[1].padStart(2, '0')}/${dm[2].padStart(2, '0')}/${yr}`;
    } else {
      // Try "March 10, 2026" format
      const monthMap = {
        january: '01', february: '02', march: '03', april: '04',
        may: '05', june: '06', july: '07', august: '08',
        september: '09', october: '10', november: '11', december: '12',
      };
      const longDate = dateRaw.match(
        /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s*(\d{4})/i
      );
      if (longDate) {
        date = `${monthMap[longDate[1].toLowerCase()]}/${longDate[2].padStart(2, '0')}/${longDate[3]}`;
      } else {
        const now = new Date();
        date = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()}`;
      }
    }

    entries.push({
      waterBody,
      county: '',
      species: 'Trout',
      quantity,
      length: '',
      date,
    });
  }

  return entries;
}

/**
 * Proxy Iowa DNR community trout stocking schedule.
 * Fetches the HTML table from the community stocking page.
 */
exports.iowaStocking = onRequest(
  { cors: ALLOWED_ORIGINS, region: 'us-west1' },
  async (req, res) => {
    const url =
      'https://www.iowadnr.gov/things-do/fishing/where-fish/trout-fishing/community-trout-stocking-schedule';

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CatchDaddy/1.0)' },
      });
      if (!response.ok) {
        res.status(502).json({ error: `IA DNR returned ${response.status}` });
        return;
      }

      const html = await response.text();
      const entries = parseIowaTable(html);

      res.set('Cache-Control', 'public, max-age=86400');
      res.json(entries);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

function parseIowaTable(html) {
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

    // IA table: Waterbody, Location (city), Spring dates, Winter dates
    const waterBody = cells[0] || '';
    const location = cells[1] || '';

    if (!waterBody) continue;

    // Parse spring and winter stocking dates from remaining cells
    for (let i = 2; i < cells.length; i++) {
      const dateStr = cells[i];
      if (!dateStr || dateStr === '-' || dateStr === 'N/A') continue;

      // Dates may be like "March 15, 10am" or "3/15/2026"
      let date = '';
      const slashDate = dateStr.match(
        /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/
      );
      if (slashDate) {
        const yr =
          slashDate[3].length === 2 ? '20' + slashDate[3] : slashDate[3];
        date = `${slashDate[1].padStart(2, '0')}/${slashDate[2].padStart(2, '0')}/${yr}`;
      } else {
        const monthMap = {
          january: '01', february: '02', march: '03', april: '04',
          may: '05', june: '06', july: '07', august: '08',
          september: '09', october: '10', november: '11', december: '12',
        };
        const longDate = dateStr.match(
          /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})/i
        );
        if (longDate) {
          const mm = monthMap[longDate[1].toLowerCase()];
          const dd = longDate[2].padStart(2, '0');
          date = `${mm}/${dd}/${new Date().getFullYear()}`;
        }
      }

      if (!date) continue;

      entries.push({
        waterBody,
        county: location,
        species: 'Trout',
        quantity: 0,
        length: '',
        date,
      });
    }
  }

  return entries;
}

/**
 * Proxy Arizona AZGFD stocking schedule Google Sheets.
 * Fetches the 3 public CSV sheets and returns them as JSON arrays.
 */
exports.arizonaStocking = onRequest(
  { cors: ALLOWED_ORIGINS, region: 'us-west1' },
  async (req, res) => {
    const sheets = [
      { name: 'Community Fishing', id: '1xJYPRrX2Gb7ACr6HxPB7mlsCw9K8NvClLfBIw7qjTcA', gid: '1486391694' },
      { name: 'Winter Stocking', id: '1PZuTV-zi5vMdxaMSnGx6c-QxeQQm-6DRQJJPKAZDjZM', gid: '1253509900' },
      { name: 'Spring/Summer', id: '1S5wsDfGzEInV64UKjUPzexAe2KOO1KocfB4dJH7oVrs', gid: '972143624' },
    ];

    try {
      const results = await Promise.allSettled(
        sheets.map(async (sheet) => {
          const url = `https://docs.google.com/spreadsheets/d/${sheet.id}/export?format=csv&gid=${sheet.gid}`;
          const resp = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CatchDaddy/1.0)' },
            redirect: 'follow',
          });
          if (!resp.ok) throw new Error(`${sheet.name}: ${resp.status}`);
          const csv = await resp.text();
          return { name: sheet.name, csv };
        })
      );

      const data = results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => r.value);

      if (data.length === 0) {
        res.status(502).json({ error: 'Failed to fetch any AZGFD sheets' });
        return;
      }

      res.set('Cache-Control', 'public, max-age=86400');
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * Proxy Colorado CPW stocking report Google Sheet.
 * Fetches the published CSV and returns it as JSON.
 */
exports.coloradoStocking = onRequest(
  { cors: ALLOWED_ORIGINS, region: 'us-west1' },
  async (req, res) => {
    const sheetId = '2PACX-1vSRURGSiGWRaPnJoz11cq0pTTaFPzIWGumsJONymkYmAmrGxYslI1f86qn2iad1R7iQzOhSlBV8rwWK';
    const gid = '757471397';
    const url = `https://docs.google.com/spreadsheets/d/e/${sheetId}/pub?gid=${gid}&single=true&output=csv`;

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CatchDaddy/1.0)' },
        redirect: 'follow',
      });
      if (!response.ok) {
        res.status(502).json({ error: `Google Sheets returned ${response.status}` });
        return;
      }

      const csv = await response.text();
      const entries = parseCpwCsv(csv);

      res.set('Cache-Control', 'public, max-age=86400');
      res.json(entries);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

function parseCpwCsv(csv) {
  const entries = [];
  const lines = csv.split('\n');
  // Skip header: Body of Water,Region,Date,Map Link
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',');
    if (row.length < 3) continue;
    const waterBody = row[0]?.trim();
    const region = row[1]?.trim();
    const rawDate = row[2]?.trim();
    if (!waterBody || !rawDate) continue;

    // Parse M/D/YYYY
    const parts = rawDate.split('/');
    if (parts.length !== 3) continue;
    const mm = parts[0].padStart(2, '0');
    const dd = parts[1].padStart(2, '0');
    const yyyy = parts[2];
    const date = `${mm}/${dd}/${yyyy}`;

    entries.push({ waterBody, county: region, species: 'Trout', quantity: 0, length: '', date });
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

    // Parse "Mar. 09-13, 2026" or "Mar. 09, 2026 - Mar. 13, 2026"
    const monthMap = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
    let date = '';
    const dateMatch = weekOf.match(/(\w+)\.?\s+(\d+)-\d+,?\s*(\d{4})/);
    const dateMatch2 = weekOf.match(/(\w+)\.?\s+(\d+),?\s*(\d{4})/);
    const dm = dateMatch || dateMatch2;
    if (dm) {
      const monthAbbr = dm[1].toLowerCase();
      const mm = monthMap[monthAbbr] || '01';
      const dd = dm[2].padStart(2, '0');
      date = `${mm}/${dd}/${dm[3]}`;
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

// ── Gemini Content Moderation (Layer 2) ──
// Fires on new messages and comments, screens via Gemini for toxicity.

async function moderateText(text) {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey || !text || text.length < 2) return { flagged: false };

  try {
    const resp = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `You are a content moderator for a family-friendly fishing app. Analyze the following user-generated message and determine if it should be flagged. Flag for: hate speech, harassment, threats, sexually explicit content, or severe profanity. Do NOT flag for: mild language, fishing slang, friendly trash talk, or competitive banter. Respond with JSON only: {"flagged": true/false, "reason": "brief reason or null"}\n\nMessage: "${text}"` }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 100 },
      }),
    });
    if (!resp.ok) return { flagged: false };
    const data = await resp.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return { flagged: !!parsed.flagged, reason: parsed.reason || null };
    }
  } catch {
    // Moderation failure should not block messages
  }
  return { flagged: false };
}

// Moderate new chat messages
exports.moderateMessage = onDocumentCreated(
  { document: 'messages/{messageId}', region: 'us-west1' },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const msg = snap.data();
    if (!msg.text) return;

    const result = await moderateText(msg.text);
    if (result.flagged) {
      const db = admin.firestore();
      await db.collection('messages').doc(snap.id).update({
        flagged: true,
        flagReason: result.reason || 'Content policy violation',
        originalText: msg.text,
        text: '[This message was removed for violating community guidelines]',
      });
      await db.collection('moderationLog').add({
        contentType: 'message',
        contentId: snap.id,
        userId: msg.userId,
        originalText: msg.text,
        reason: result.reason,
        action: 'removed',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }
);

// Moderate new comments
exports.moderateComment = onDocumentCreated(
  { document: 'comments/{commentId}', region: 'us-west1' },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const comment = snap.data();
    if (!comment.text) return;

    const result = await moderateText(comment.text);
    if (result.flagged) {
      const db = admin.firestore();
      await db.collection('comments').doc(snap.id).update({
        flagged: true,
        flagReason: result.reason || 'Content policy violation',
        originalText: comment.text,
        text: '[This comment was removed for violating community guidelines]',
      });
      await db.collection('moderationLog').add({
        contentType: 'comment',
        contentId: snap.id,
        userId: comment.userId,
        originalText: comment.text,
        reason: result.reason,
        action: 'removed',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }
);
