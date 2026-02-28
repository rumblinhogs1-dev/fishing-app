const { onRequest } = require('firebase-functions/v2/https');

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
