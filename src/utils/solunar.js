/**
 * Solunar / bite score utilities — pure functions, no API calls.
 */

// Reference new moon: Jan 6, 2000 18:14 UTC
const REFERENCE_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14, 0);
const SYNODIC_PERIOD = 29.53058867; // days

/**
 * Get moon phase info for a given date.
 */
export function getMoonPhase(date = new Date()) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const daysSinceRef = (d.getTime() - REFERENCE_NEW_MOON) / (1000 * 60 * 60 * 24);
  const cycle = ((daysSinceRef % SYNODIC_PERIOD) + SYNODIC_PERIOD) % SYNODIC_PERIOD;
  const phase = cycle / SYNODIC_PERIOD; // 0–1

  // Illumination: 0 at new, 1 at full
  const illumination = Math.round((1 - Math.cos(phase * 2 * Math.PI)) / 2 * 100);

  let name, emoji;
  if (phase < 0.0625)      { name = 'New Moon';        emoji = '🌑'; }
  else if (phase < 0.1875) { name = 'Waxing Crescent'; emoji = '🌒'; }
  else if (phase < 0.3125) { name = 'First Quarter';   emoji = '🌓'; }
  else if (phase < 0.4375) { name = 'Waxing Gibbous';  emoji = '🌔'; }
  else if (phase < 0.5625) { name = 'Full Moon';        emoji = '🌕'; }
  else if (phase < 0.6875) { name = 'Waning Gibbous';  emoji = '🌖'; }
  else if (phase < 0.8125) { name = 'Last Quarter';    emoji = '🌗'; }
  else if (phase < 0.9375) { name = 'Waning Crescent'; emoji = '🌘'; }
  else                      { name = 'New Moon';        emoji = '🌑'; }

  return { phase, illumination, name, emoji };
}

/**
 * Approximate moon transit/nadir times and rise/set for solunar periods.
 * Uses simplified calculation (~30 min precision).
 */
export function getSolunarPeriods(date = new Date(), lat = 0) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const daysSinceRef = (d.getTime() - REFERENCE_NEW_MOON) / (1000 * 60 * 60 * 24);
  const cycle = ((daysSinceRef % SYNODIC_PERIOD) + SYNODIC_PERIOD) % SYNODIC_PERIOD;

  // Moon transit happens ~50 min later each day; use cycle position
  const transitOffset = (cycle / SYNODIC_PERIOD) * 24; // hours offset from midnight
  const transitHour = (12.4 + transitOffset * 0.997) % 24; // approximate moon transit

  // Nadir is ~12 hours from transit
  const nadirHour = (transitHour + 12) % 24;

  // Moonrise/set ~6 hours from transit (simplified, latitude-adjusted)
  const latFactor = Math.abs(lat) / 90 * 0.5;
  const riseHour = (transitHour - 6 - latFactor + 24) % 24;
  const setHour = (transitHour + 6 + latFactor) % 24;

  const makeWindow = (centerHour, durationMin) => {
    const halfDur = durationMin / 2;
    const startMin = centerHour * 60 - halfDur;
    const endMin = centerHour * 60 + halfDur;
    return {
      start: formatMinutes((startMin + 1440) % 1440),
      end: formatMinutes((endMin + 1440) % 1440),
      startMin: (startMin + 1440) % 1440,
      endMin: (endMin + 1440) % 1440,
    };
  };

  const majorPeriods = [
    { ...makeWindow(transitHour, 120), label: 'Moon Transit', type: 'major' },
    { ...makeWindow(nadirHour, 120), label: 'Moon Underfoot', type: 'major' },
  ];

  const minorPeriods = [
    { ...makeWindow(riseHour, 60), label: 'Moonrise', type: 'minor' },
    { ...makeWindow(setHour, 60), label: 'Moonset', type: 'minor' },
  ];

  return { majorPeriods, minorPeriods };
}

/**
 * Calculate bite score from multiple factors.
 * Returns score 1–10 with breakdown.
 */
export function calculateBiteScore({ moonPhase, solunarPeriods, pressureTrend, sunrise, sunset, windSpeed, cloudCover, currentHour }) {
  const factors = [];

  // Moon phase: 0–2.5 pts (full/new = max)
  const moonPhaseFrac = moonPhase?.phase ?? 0.5;
  // Closer to 0 or 1 (new) or 0.5 (full) = better
  const moonCloseness = Math.min(
    Math.abs(moonPhaseFrac),
    Math.abs(moonPhaseFrac - 0.5),
    Math.abs(moonPhaseFrac - 1)
  ) * 2; // 0 at new/full, 0.5 at quarters
  const moonPts = Math.round((1 - moonCloseness * 2) * 2.5 * 10) / 10;
  const clampedMoonPts = Math.max(0, Math.min(2.5, moonPts));
  factors.push({ name: 'Moon Phase', points: clampedMoonPts, max: 2.5, detail: moonPhase?.name || 'Unknown' });

  // Solunar window: 0–2.0 pts
  let solunarPts = 0;
  if (solunarPeriods && currentHour != null) {
    const curMin = currentHour * 60;
    const inMajor = solunarPeriods.majorPeriods?.some(p => isInWindow(curMin, p.startMin, p.endMin));
    const inMinor = solunarPeriods.minorPeriods?.some(p => isInWindow(curMin, p.startMin, p.endMin));
    if (inMajor) { solunarPts = 2.0; }
    else if (inMinor) { solunarPts = 1.2; }
    else {
      // Proximity bonus: within 30 min of any period
      const allPeriods = [...(solunarPeriods.majorPeriods || []), ...(solunarPeriods.minorPeriods || [])];
      const closest = Math.min(...allPeriods.map(p => Math.min(
        Math.abs(curMin - p.startMin),
        Math.abs(curMin - p.endMin),
        Math.abs(curMin - p.startMin + 1440),
        Math.abs(curMin - p.endMin + 1440)
      )));
      if (closest < 30) solunarPts = 0.5;
    }
  }
  factors.push({
    name: 'Solunar Window',
    points: solunarPts,
    max: 2.0,
    detail: solunarPts >= 2 ? 'Major period' : solunarPts >= 1 ? 'Minor period' : solunarPts > 0 ? 'Near period' : 'Outside periods',
  });

  // Pressure trend: 0–1.5 pts
  let pressurePts = 0.5; // default steady
  if (pressureTrend === 'falling') pressurePts = 1.5;
  else if (pressureTrend === 'rising') pressurePts = 0.8;
  else if (pressureTrend === 'steady') pressurePts = 1.0;
  factors.push({ name: 'Pressure', points: pressurePts, max: 1.5, detail: pressureTrend ? `${pressureTrend.charAt(0).toUpperCase() + pressureTrend.slice(1)}` : 'Unknown' });

  // Dawn/dusk: 0–1.5 pts
  let dawnDuskPts = 0;
  if (sunrise != null && sunset != null && currentHour != null) {
    const sunriseH = parseTimeToHour(sunrise);
    const sunsetH = parseTimeToHour(sunset);
    const distToSunrise = Math.abs(currentHour - sunriseH);
    const distToSunset = Math.abs(currentHour - sunsetH);
    const closest = Math.min(distToSunrise, distToSunset);
    if (closest <= 0.5) dawnDuskPts = 1.5;
    else if (closest <= 1) dawnDuskPts = 1.0;
    else if (closest <= 1.5) dawnDuskPts = 0.5;
  }
  factors.push({ name: 'Dawn/Dusk', points: dawnDuskPts, max: 1.5, detail: dawnDuskPts >= 1.0 ? 'Golden hour' : dawnDuskPts > 0 ? 'Near golden hour' : 'Midday/night' });

  // Wind speed: 0–1.5 pts (5–15 mph ideal)
  let windPts = 0;
  if (windSpeed != null) {
    if (windSpeed >= 5 && windSpeed <= 15) windPts = 1.5;
    else if (windSpeed >= 3 && windSpeed <= 20) windPts = 1.0;
    else if (windSpeed < 3) windPts = 0.5;
    else windPts = 0.3; // >20 mph
  }
  factors.push({ name: 'Wind', points: windPts, max: 1.5, detail: windSpeed != null ? `${windSpeed} mph` : 'Unknown' });

  // Cloud cover: 0–1.0 pts (overcast slightly better)
  let cloudPts = 0.5;
  if (cloudCover != null) {
    if (cloudCover >= 60 && cloudCover <= 90) cloudPts = 1.0;
    else if (cloudCover >= 40) cloudPts = 0.8;
    else if (cloudCover >= 20) cloudPts = 0.6;
    else cloudPts = 0.4; // clear sky
  }
  factors.push({ name: 'Cloud Cover', points: cloudPts, max: 1.0, detail: cloudCover != null ? `${cloudCover}%` : 'Unknown' });

  const rawScore = factors.reduce((sum, f) => sum + f.points, 0);
  const score = Math.max(1, Math.min(10, Math.round(rawScore)));

  let label, color;
  if (score >= 8)      { label = 'Excellent'; color = '#2e7d32'; }
  else if (score >= 6) { label = 'Good';      color = '#f9a825'; }
  else if (score >= 4) { label = 'Fair';      color = '#ef6c00'; }
  else                 { label = 'Poor';      color = '#c62828'; }

  return { score, label, color, factors };
}

/**
 * Determine pressure trend from hourly pressure readings.
 */
export function getPressureTrend(hourlyPressures) {
  if (!hourlyPressures || hourlyPressures.length < 3) return 'steady';
  // Compare last 3 hours
  const recent = hourlyPressures.slice(-3);
  const diff = recent[recent.length - 1] - recent[0];
  if (diff > 1.5) return 'rising';
  if (diff < -1.5) return 'falling';
  return 'steady';
}

/**
 * Find best fishing time windows from solunar + sunrise/sunset.
 */
export function getBestTimeWindows({ solunarPeriods, sunrise, sunset }) {
  const windows = [];

  if (sunrise) {
    const sH = parseTimeToHour(sunrise);
    windows.push({
      start: formatMinutes(Math.max(0, (sH - 0.5) * 60)),
      end: formatMinutes((sH + 1) * 60),
      reason: 'Dawn feeding',
      quality: 'high',
    });
  }

  if (sunset) {
    const sH = parseTimeToHour(sunset);
    windows.push({
      start: formatMinutes((sH - 1) * 60),
      end: formatMinutes(Math.min(1439, (sH + 0.5) * 60)),
      reason: 'Dusk feeding',
      quality: 'high',
    });
  }

  if (solunarPeriods) {
    for (const p of solunarPeriods.majorPeriods || []) {
      windows.push({ start: p.start, end: p.end, reason: p.label, quality: 'high' });
    }
    for (const p of solunarPeriods.minorPeriods || []) {
      windows.push({ start: p.start, end: p.end, reason: p.label, quality: 'medium' });
    }
  }

  // Sort by start time
  windows.sort((a, b) => {
    const aMin = parseTimeToMin(a.start);
    const bMin = parseTimeToMin(b.start);
    return aMin - bMin;
  });

  return windows;
}

/**
 * Ideal water temperature ranges by species (Fahrenheit).
 */
export const IDEAL_TEMP_RANGES = {
  largemouth_bass:  { ideal: [65, 80], good: [55, 85], label: 'Largemouth Bass' },
  smallmouth_bass:  { ideal: [65, 75], good: [55, 80], label: 'Smallmouth Bass' },
  walleye:          { ideal: [55, 68], good: [45, 75], label: 'Walleye' },
  crappie:          { ideal: [60, 72], good: [50, 78], label: 'Crappie' },
  bluegill:         { ideal: [68, 82], good: [60, 86], label: 'Bluegill' },
  channel_catfish:  { ideal: [75, 85], good: [65, 90], label: 'Channel Catfish' },
  rainbow_trout:    { ideal: [50, 60], good: [40, 65], label: 'Rainbow Trout' },
  brown_trout:      { ideal: [55, 65], good: [44, 70], label: 'Brown Trout' },
  brook_trout:      { ideal: [48, 58], good: [38, 64], label: 'Brook Trout' },
  northern_pike:    { ideal: [60, 70], good: [50, 75], label: 'Northern Pike' },
  musky:            { ideal: [65, 75], good: [55, 80], label: 'Musky' },
  striped_bass:     { ideal: [60, 70], good: [50, 78], label: 'Striped Bass' },
  redfish:          { ideal: [70, 85], good: [60, 90], label: 'Redfish' },
  spotted_seatrout: { ideal: [65, 78], good: [55, 85], label: 'Spotted Seatrout' },
};

/**
 * Check how current water temp compares to a species' ideal range.
 */
export function getSpeciesTempStatus(speciesKey, waterTemp, tempRanges = IDEAL_TEMP_RANGES) {
  const range = tempRanges[speciesKey];
  if (!range || waterTemp == null) return { status: 'unknown', label: 'Unknown', range: null };

  if (waterTemp >= range.ideal[0] && waterTemp <= range.ideal[1]) {
    return { status: 'ideal', label: 'Ideal', range };
  }
  if (waterTemp >= range.good[0] && waterTemp <= range.good[1]) {
    return { status: 'good', label: 'Good', range };
  }
  return { status: 'poor', label: waterTemp < range.good[0] ? 'Too Cold' : 'Too Warm', range };
}

/**
 * Merge additional AI-returned species into IDEAL_TEMP_RANGES.
 */
export function getMergedTempRanges(additionalSpecies) {
  if (!additionalSpecies?.length) return IDEAL_TEMP_RANGES;
  const merged = { ...IDEAL_TEMP_RANGES };
  for (const s of additionalSpecies) {
    if (s.key && s.label && s.ideal && s.good) {
      merged[s.key] = { ideal: s.ideal, good: s.good, label: s.label };
    }
  }
  return merged;
}

// --- Helpers ---

function isInWindow(curMin, startMin, endMin) {
  if (startMin <= endMin) return curMin >= startMin && curMin <= endMin;
  // Wraps midnight
  return curMin >= startMin || curMin <= endMin;
}

function formatMinutes(totalMin) {
  const rounded = ((Math.round(totalMin) % 1440) + 1440) % 1440;
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function parseTimeToHour(timeStr) {
  if (typeof timeStr === 'number') return timeStr;
  // Handle ISO string like "2025-01-01T06:30"
  if (timeStr.includes('T')) {
    const parts = timeStr.split('T')[1].split(':');
    return parseInt(parts[0]) + parseInt(parts[1]) / 60;
  }
  // Handle "6:30 AM" format
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return 6;
  let h = parseInt(match[1]);
  const m = parseInt(match[2]);
  if (match[3]?.toUpperCase() === 'PM' && h < 12) h += 12;
  if (match[3]?.toUpperCase() === 'AM' && h === 12) h = 0;
  return h + m / 60;
}

function parseTimeToMin(timeStr) {
  return parseTimeToHour(timeStr) * 60;
}
