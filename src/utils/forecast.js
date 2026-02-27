/**
 * Forecast API calls, caching, and orchestration.
 */
import { getMoonPhase, getSolunarPeriods, calculateBiteScore, getPressureTrend, getBestTimeWindows } from './solunar.js';
import { fetchWaterData, reverseGeocode, haversine } from './weather.js';

// --- Cache ---
const FORECAST_CACHE_KEY = 'fishing-forecast-cache-v2';
const FORECAST_TTL = 30 * 60 * 1000; // 30 minutes
const MAX_FORECAST_CACHE = 10;

const NOAA_STATIONS_CACHE_KEY = 'fishing-noaa-stations-cache';
const NOAA_STATIONS_TTL = 24 * 60 * 60 * 1000; // 24 hours

function getCache(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch {
    return {};
  }
}

function setCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch { /* quota exceeded - ignore */ }
}

function getCacheEntry(cacheKey, entryKey, ttl) {
  const cache = getCache(cacheKey);
  const entry = cache[entryKey];
  if (entry && Date.now() - entry.storedAt < ttl) {
    entry.accessedAt = Date.now();
    setCache(cacheKey, cache);
    return entry.data;
  }
  return null;
}

function setCacheEntry(cacheKey, entryKey, data, maxEntries) {
  const cache = getCache(cacheKey);
  cache[entryKey] = { data, storedAt: Date.now(), accessedAt: Date.now() };

  // Evict LRU if over limit
  const keys = Object.keys(cache);
  if (keys.length > maxEntries) {
    const sorted = keys.sort((a, b) => (cache[a].accessedAt || 0) - (cache[b].accessedAt || 0));
    for (let i = 0; i < keys.length - maxEntries; i++) {
      delete cache[sorted[i]];
    }
  }

  setCache(cacheKey, cache);
}

function coordKey(lat, lng) {
  return `${lat.toFixed(2)}_${lng.toFixed(2)}`;
}

// --- Open-Meteo Forecast ---

/**
 * Fetch 5-day forecast + 24hr hourly data from Open-Meteo.
 */
export async function fetchForecastData(lat, lng) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&daily=temperature_2m_max,temperature_2m_min,wind_speed_10m_max,wind_direction_10m_dominant,sunrise,sunset,precipitation_sum,weather_code` +
    `&hourly=temperature_2m,relative_humidity_2m,pressure_msl,wind_speed_10m,wind_gusts_10m,cloud_cover` +
    `&temperature_unit=fahrenheit&wind_speed_unit=mph&forecast_days=5&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch forecast data.');

  const data = await res.json();

  // Extract hourly data for current conditions + pressure trend
  const hourly = data.hourly || {};
  const now = new Date();
  const currentHourIndex = hourly.time?.findIndex(t => new Date(t) > now) - 1;
  const idx = Math.max(0, currentHourIndex);

  const hourlyPressures = (hourly.pressure_msl || []).slice(Math.max(0, idx - 6), idx + 1);
  const pressureTrend = getPressureTrend(hourlyPressures);

  const current = {
    temp: hourly.temperature_2m?.[idx] != null ? Math.round(hourly.temperature_2m[idx]) : null,
    pressure: hourly.pressure_msl?.[idx] != null ? Math.round(hourly.pressure_msl[idx]) : null,
    windSpeed: hourly.wind_speed_10m?.[idx] != null ? Math.round(hourly.wind_speed_10m[idx]) : null,
    windGusts: hourly.wind_gusts_10m?.[idx] != null ? Math.round(hourly.wind_gusts_10m[idx]) : null,
    cloudCover: hourly.cloud_cover?.[idx] != null ? Math.round(hourly.cloud_cover[idx]) : null,
    humidity: hourly.relative_humidity_2m?.[idx] != null ? Math.round(hourly.relative_humidity_2m[idx]) : null,
    pressureTrend,
  };

  // Daily forecast
  const daily = data.daily || {};
  const days = (daily.time || []).map((date, i) => ({
    date,
    tempMax: daily.temperature_2m_max?.[i] != null ? Math.round(daily.temperature_2m_max[i]) : null,
    tempMin: daily.temperature_2m_min?.[i] != null ? Math.round(daily.temperature_2m_min[i]) : null,
    windMax: daily.wind_speed_10m_max?.[i] != null ? Math.round(daily.wind_speed_10m_max[i]) : null,
    windDir: daily.wind_direction_10m_dominant?.[i] ?? null,
    sunrise: daily.sunrise?.[i] || null,
    sunset: daily.sunset?.[i] || null,
    precip: daily.precipitation_sum?.[i] ?? 0,
    weatherCode: daily.weather_code?.[i] ?? 0,
  }));

  return { current, days, timezone: data.timezone };
}

// --- NOAA Tides ---

/**
 * Fetch NOAA tide station list (cached 24hr).
 */
async function fetchNOAAStations() {
  const cached = getCacheEntry(NOAA_STATIONS_CACHE_KEY, 'stations', NOAA_STATIONS_TTL);
  if (cached) return cached;

  try {
    const res = await fetch('https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json?type=tidepredictions');
    if (!res.ok) return [];
    const data = await res.json();
    const stations = (data.stations || []).map(s => ({
      id: s.id,
      name: s.name,
      lat: s.lat,
      lng: s.lng,
    }));
    setCacheEntry(NOAA_STATIONS_CACHE_KEY, 'stations', stations, 1);
    return stations;
  } catch {
    return [];
  }
}

/**
 * Fetch tide predictions for nearest coastal station within 50 miles.
 * Returns null for inland locations.
 */
export async function fetchTideData(lat, lng) {
  try {
    const stations = await fetchNOAAStations();
    if (!stations.length) return null;

    // Find nearest station within 50 miles
    let nearest = null;
    let bestDist = 50;
    for (const s of stations) {
      const dist = haversine(lat, lng, s.lat, s.lng);
      if (dist < bestDist) {
        bestDist = dist;
        nearest = s;
      }
    }

    if (!nearest) return null;

    // Fetch 2-day hi/lo predictions
    const today = new Date();
    const begin = formatDateForNOAA(today);
    const end = formatDateForNOAA(new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000));

    const url = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter` +
      `?begin_date=${begin}&end_date=${end}&station=${nearest.id}` +
      `&product=predictions&datum=MLLW&time_zone=lst_ldy&units=english&interval=hilo&format=json`;

    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    const predictions = (data.predictions || []).map(p => ({
      time: p.t,
      height: parseFloat(p.v),
      type: p.type === 'H' ? 'High' : 'Low',
    }));

    if (!predictions.length) return null;

    return {
      stationName: nearest.name,
      stationDistance: Math.round(bestDist),
      predictions,
    };
  } catch {
    return null;
  }
}

// --- Full Forecast Orchestrator ---

/**
 * Get complete forecast data: weather, water, tides, solunar, bite scores.
 */
export async function getFullForecast(lat, lng) {
  const key = coordKey(lat, lng);
  const cached = getCacheEntry(FORECAST_CACHE_KEY, key, FORECAST_TTL);
  if (cached) return cached;

  const [forecastData, waterData, tideData, locationName] = await Promise.all([
    fetchForecastData(lat, lng),
    fetchWaterData(lat, lng).catch(() => null),
    fetchTideData(lat, lng).catch(() => null),
    reverseGeocode(lat, lng).catch(() => null),
  ]);

  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;

  // Compute solunar/moon/bite for each day
  const daysWithScores = forecastData.days.map((day) => {
    const dayDate = new Date(day.date + 'T12:00:00');
    const moonPhase = getMoonPhase(dayDate);
    const solunarPeriods = getSolunarPeriods(dayDate, lat);
    const bestWindows = getBestTimeWindows({ solunarPeriods, sunrise: day.sunrise, sunset: day.sunset });

    const biteScore = calculateBiteScore({
      moonPhase,
      solunarPeriods,
      pressureTrend: forecastData.current.pressureTrend,
      sunrise: day.sunrise,
      sunset: day.sunset,
      windSpeed: day.windMax,
      cloudCover: forecastData.current.cloudCover,
      currentHour: day.date === forecastData.days[0]?.date ? currentHour : 10, // Use 10am for future days
    });

    return { ...day, moonPhase, solunarPeriods, biteScore, bestWindows };
  });

  const result = {
    location: locationName,
    lat,
    lng,
    current: forecastData.current,
    days: daysWithScores,
    waterData,
    tideData,
    fetchedAt: Date.now(),
  };

  setCacheEntry(FORECAST_CACHE_KEY, key, result, MAX_FORECAST_CACHE);
  return result;
}

/**
 * Overall "Should I Fish?" recommendation from today's forecast.
 */
export function getShouldIFishScore(forecastData) {
  if (!forecastData?.days?.length) {
    return { recommendation: 'No data', color: '#888', score: 0, reasons: [], bestWindow: null };
  }

  const today = forecastData.days[0];
  const score = today.biteScore?.score ?? 5;

  let recommendation, color;
  if (score >= 8) { recommendation = 'Get out there! Excellent conditions!'; color = '#2e7d32'; }
  else if (score >= 6) { recommendation = 'Good conditions — worth a trip.'; color = '#f9a825'; }
  else if (score >= 4) { recommendation = 'Fair conditions — manage expectations.'; color = '#ef6c00'; }
  else { recommendation = 'Tough conditions — consider waiting.'; color = '#c62828'; }

  const reasons = (today.biteScore?.factors || [])
    .filter(f => f.points > f.max * 0.6)
    .map(f => `${f.name}: ${f.detail}`)
    .slice(0, 3);

  if (today.precip > 0.5) reasons.push(`Rain expected: ${today.precip}" precipitation`);

  const bestWindow = today.bestWindows?.[0] || null;

  return { recommendation, color, score, reasons, bestWindow };
}

// --- Helpers ---

function formatDateForNOAA(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}
