export const WEATHER_CODES = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Rime fog', 51: 'Light drizzle', 53: 'Moderate drizzle',
  55: 'Dense drizzle', 61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
  66: 'Freezing rain', 67: 'Heavy freezing rain', 71: 'Slight snow', 73: 'Moderate snow',
  75: 'Heavy snow', 77: 'Snow grains', 80: 'Slight showers', 81: 'Moderate showers',
  82: 'Violent showers', 85: 'Slight snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm w/ hail', 99: 'Thunderstorm w/ heavy hail',
};

export function weatherEmoji(code) {
  if (code <= 1) return '\u2600\uFE0F';
  if (code <= 3) return '\u26C5';
  if (code <= 48) return '\uD83C\uDF2B\uFE0F';
  if (code <= 55) return '\uD83C\uDF26\uFE0F';
  if (code <= 67) return '\uD83C\uDF27\uFE0F';
  if (code <= 77) return '\u2744\uFE0F';
  if (code <= 82) return '\uD83C\uDF26\uFE0F';
  if (code <= 86) return '\uD83C\uDF28\uFE0F';
  return '\u26C8\uFE0F';
}

/**
 * Get the user's current GPS coordinates via browser Geolocation API.
 */
export function getGPSLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        if (err.code === 1) reject(new Error('Location access denied. Please allow location permissions.'));
        else if (err.code === 2) reject(new Error('Location unavailable. Please try again.'));
        else reject(new Error('Location request timed out. Please try again.'));
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  });
}

/**
 * Reverse geocode coordinates to a place name using Open-Meteo's geocoding.
 */
export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address || {};
    const parts = [addr.water, addr.lake, addr.river, addr.city, addr.town, addr.village, addr.county, addr.state].filter(Boolean);
    return parts.slice(0, 3).join(', ') || data.display_name?.split(',').slice(0, 3).join(',') || null;
  } catch {
    return null;
  }
}

/**
 * Fetch current weather from Open-Meteo (free, no API key).
 */
export async function fetchWeather(lat, lng) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl,cloud_cover&temperature_unit=fahrenheit&wind_speed_unit=mph`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch weather data.');

  const data = await res.json();
  const c = data.current;
  if (!c) throw new Error('No weather data available for this location.');

  const condition = WEATHER_CODES[c.weather_code] || 'Unknown';
  const temp = Math.round(c.temperature_2m);
  const humidity = Math.round(c.relative_humidity_2m);
  const wind = Math.round(c.wind_speed_10m);
  const pressure = Math.round(c.pressure_msl);
  const cloudCover = c.cloud_cover != null ? Math.round(c.cloud_cover) : null;

  const summary = `${condition}, ${temp}°F, Humidity ${humidity}%, Wind ${wind} mph, Pressure ${pressure} hPa${cloudCover != null ? `, Clouds ${cloudCover}%` : ''}`;

  return {
    summary,
    condition,
    temp,
    humidity,
    wind,
    pressure,
    cloudCover,
  };
}

/**
 * Fetch nearest USGS water station data (water temp & flow rate).
 * Uses USGS Water Services API (free, no key).
 * Parameter codes: 00010 = water temp (°C), 00060 = discharge/flow (ft³/s), 00065 = gauge height (ft)
 */
export async function fetchWaterData(lat, lng) {
  // USGS site search: find nearest sites within ~30 miles that have recent data
  const bbox = buildBBox(lat, lng, 0.5); // ~30 mile radius
  const url = `https://waterservices.usgs.gov/nwis/iv/?format=json&bBox=${bbox}&parameterCd=00010,00060,00065&siteStatus=active`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  const timeSeries = data.value?.timeSeries;
  if (!timeSeries || timeSeries.length === 0) return null;

  let waterTemp = null;
  let flowRate = null;
  let gaugeHeight = null;
  let stationName = null;

  // Find the closest station with data
  let bestDist = Infinity;

  for (const ts of timeSeries) {
    const site = ts.sourceInfo;
    const sLat = site?.geoLocation?.geogLocation?.latitude;
    const sLng = site?.geoLocation?.geogLocation?.longitude;
    if (!sLat || !sLng) continue;

    const dist = haversine(lat, lng, sLat, sLng);
    const val = ts.values?.[0]?.value?.[0]?.value;
    if (!val || val === '-999999') continue;

    const paramCode = ts.variable?.variableCode?.[0]?.value;

    if (dist < bestDist || (dist === bestDist && paramCode === '00010')) {
      bestDist = dist;
      stationName = site.siteName;
    }

    if (paramCode === '00010') {
      // Water temp in Celsius, convert to Fahrenheit
      const tempC = parseFloat(val);
      if (!isNaN(tempC)) waterTemp = Math.round(tempC * 9 / 5 + 32);
    }

    if (paramCode === '00060') {
      const flow = parseFloat(val);
      if (!isNaN(flow)) flowRate = Math.round(flow);
    }

    if (paramCode === '00065') {
      const gh = parseFloat(val);
      if (!isNaN(gh)) gaugeHeight = Math.round(gh * 100) / 100;
    }
  }

  if (waterTemp === null && flowRate === null && gaugeHeight === null) return null;

  return {
    waterTemp,
    flowRate,
    gaugeHeight,
    stationName: stationName || 'Nearby USGS station',
  };
}

/** Build a bounding box string for USGS: west,south,east,north */
export function buildBBox(lat, lng, delta) {
  return `${(lng - delta).toFixed(4)},${(lat - delta).toFixed(4)},${(lng + delta).toFixed(4)},${(lat + delta).toFixed(4)}`;
}

/**
 * Forward geocode a location query (city, zip, lake name, etc.) using Nominatim.
 */
export async function geocodeLocation(query) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
  );
  if (!res.ok) throw new Error('Geocoding request failed. Please try again.');
  const results = await res.json();
  if (!results.length) throw new Error(`No results found for "${query}". Try a different search.`);
  const top = results[0];
  return {
    lat: parseFloat(top.lat),
    lng: parseFloat(top.lon),
    displayName: top.display_name,
  };
}

/** Haversine distance in miles */
export function haversine(lat1, lng1, lat2, lng2) {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
