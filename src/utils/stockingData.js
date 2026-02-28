const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

function csvUrl(sheetId, gid) {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

/** Minimal CSV parser that handles quoted fields */
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field.trim());
      field = '';
    } else if (ch === '\n' || (ch === '\r' && text[i + 1] === '\n')) {
      row.push(field.trim());
      rows.push(row);
      row = [];
      field = '';
      if (ch === '\r') i++;
    } else {
      field += ch;
    }
  }
  if (field || row.length) {
    row.push(field.trim());
    rows.push(row);
  }
  return rows;
}

/** Detect if a cell looks like a month name */
function detectMonth(cell) {
  if (!cell) return -1;
  const lower = cell.toLowerCase().trim();
  return MONTH_NAMES.findIndex((m) => lower.startsWith(m));
}

/** Parse day range like "6-12" or "6 - 12" or just "6" from a header cell */
function parseDayRange(cell) {
  if (!cell) return null;
  const m = cell.match(/(\d{1,2})\s*[-–]\s*(\d{1,2})/);
  if (m) return { start: parseInt(m[1], 10), end: parseInt(m[2], 10) };
  const single = cell.match(/^(\d{1,2})$/);
  if (single) return { start: parseInt(single[1], 10), end: parseInt(single[1], 10) };
  return null;
}

/** Guess the schedule year — use current year, or next year if we're past October */
function guessYear() {
  const now = new Date();
  return now.getFullYear();
}

/**
 * Parse the calendar-grid CSV into structured stocking entries.
 * Returns array of { waterBody, region, species, weekStart, weekEnd, sheetName }
 */
function parseSheet(rows, sheetType, sheetName) {
  const entries = [];
  if (!rows || rows.length < 3) return entries;

  const year = guessYear();

  // Find the header rows: one row has month names, next row has day ranges
  let monthRowIdx = -1;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const monthHits = rows[i].filter((c) => detectMonth(c) >= 0).length;
    if (monthHits >= 2) { monthRowIdx = i; break; }
  }
  if (monthRowIdx < 0) return entries;

  const monthRow = rows[monthRowIdx];
  // The day-range row could be the same row or the next
  let dayRowIdx = monthRowIdx + 1;
  if (dayRowIdx >= rows.length) dayRowIdx = monthRowIdx;
  const dayRow = rows[dayRowIdx];

  // Build week columns: fill-forward months across columns
  const weekCols = [];
  let currentMonth = -1;
  for (let col = 1; col < Math.max(monthRow.length, dayRow.length); col++) {
    const m = detectMonth(monthRow[col]);
    if (m >= 0) currentMonth = m;
    if (currentMonth < 0) continue;

    const dayRange = parseDayRange(dayRow[col]) || parseDayRange(monthRow[col]);
    if (!dayRange) {
      // Still track the column with just the month
      weekCols.push({ col, month: currentMonth, startDay: null, endDay: null });
      continue;
    }

    weekCols.push({
      col,
      month: currentMonth,
      startDay: dayRange.start,
      endDay: dayRange.end,
    });
  }

  // Data rows start after the day-range row
  const dataStart = dayRowIdx + 1;
  let currentRegion = '';

  for (let r = dataStart; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const firstCell = (row[0] || '').trim();
    if (!firstCell) continue;

    // Detect region headers: all-caps or no stocking data in columns
    const hasData = row.slice(1).some((c) => {
      const v = (c || '').trim().toUpperCase();
      return v === 'T' || v === 'C' || v === 'X' || v === 'CC' || v === 'RT';
    });

    if (!hasData) {
      // Likely a region header
      if (firstCell.length > 2) currentRegion = firstCell;
      continue;
    }

    // This is a water body row
    const waterBody = normalizeName(firstCell);

    for (const wc of weekCols) {
      const cell = (row[wc.col] || '').trim().toUpperCase();
      if (!cell || cell === '**' || cell === '--' || cell === '-') continue;

      let species = [];
      if (sheetType === 'winter') {
        if (cell === 'X' || cell === 'T') species = ['Trout'];
      } else {
        if (cell.includes('T')) species.push('Trout');
        if (cell.includes('C')) species.push('Catfish');
        if (cell === 'RT') species = ['Rainbow Trout'];
        if (cell === 'CC') species = ['Channel Catfish'];
      }
      if (species.length === 0) continue;

      let weekStart = null;
      let weekEnd = null;
      if (wc.startDay) {
        weekStart = new Date(year, wc.month, wc.startDay);
        weekEnd = new Date(year, wc.month, wc.endDay);
      }

      entries.push({
        waterBody,
        region: currentRegion,
        species,
        weekStart,
        weekEnd,
        sheetName,
      });
    }
  }

  return entries;
}

/** Normalize water body names for matching */
export function normalizeName(name) {
  return name
    .replace(/\s*\(.*?\)\s*/g, ' ')   // remove parenthetical city prefixes
    .replace(/\s+/g, ' ')
    .trim();
}

/** Fetch and parse all stocking sheets */
export async function fetchStockingData({ sheets, cacheKey, forceRefresh = false } = {}) {
  if (!sheets || !cacheKey) {
    throw new Error('fetchStockingData requires sheets and cacheKey');
  }

  // Check cache
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL && data?.length) {
          return data.map((e) => ({
            ...e,
            weekStart: e.weekStart ? new Date(e.weekStart) : null,
            weekEnd: e.weekEnd ? new Date(e.weekEnd) : null,
          }));
        }
      }
    } catch { /* ignore */ }
  }

  const results = await Promise.allSettled(
    sheets.map(async (sheet) => {
      const resp = await fetch(csvUrl(sheet.id, sheet.gid));
      if (!resp.ok) throw new Error(`${sheet.name}: ${resp.status}`);
      const text = await resp.text();
      const rows = parseCSV(text);
      return parseSheet(rows, sheet.type, sheet.name);
    })
  );

  const allEntries = [];
  const errors = [];

  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      allEntries.push(...r.value);
    } else {
      errors.push({ sheet: sheets[i].name, error: r.reason?.message });
    }
  });

  if (allEntries.length === 0 && errors.length > 0) {
    throw new Error('Failed to load stocking data: ' + errors.map((e) => e.sheet).join(', '));
  }

  // Cache
  try {
    localStorage.setItem(cacheKey, JSON.stringify({
      data: allEntries,
      timestamp: Date.now(),
      errors,
    }));
  } catch { /* ignore */ }

  return allEntries;
}

/** Get entries for the current week */
export function getCurrentWeekStocking(entries) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return entries.filter((e) => {
    if (!e.weekStart || !e.weekEnd) return false;
    return e.weekStart <= today && e.weekEnd >= today;
  });
}

/** Get entries for upcoming weeks (next 2 weeks) */
export function getUpcomingStocking(entries) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const twoWeeks = new Date(today);
  twoWeeks.setDate(twoWeeks.getDate() + 14);
  return entries.filter((e) => {
    if (!e.weekStart) return false;
    return e.weekStart > today && e.weekStart <= twoWeeks;
  });
}

/** Get entries stocked recently (past 2 weeks) */
export function getRecentlyStocked(entries) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  return entries.filter((e) => {
    if (!e.weekEnd) return false;
    return e.weekEnd < today && e.weekEnd >= twoWeeksAgo;
  });
}

/** Get all stocking entries for a specific water body (fuzzy match) */
export function getStockingForWaterBody(entries, name) {
  const needle = normalizeName(name).toLowerCase();
  return entries.filter((e) => {
    const hay = e.waterBody.toLowerCase();
    return hay.includes(needle) || needle.includes(hay);
  });
}
