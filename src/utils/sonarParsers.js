/**
 * Sonar/fish finder log parsers for CSV and GPX formats.
 * Zero external dependencies — uses built-in DOMParser for GPX.
 */

const LAT_ALIASES = ['lat', 'latitude', 'position_lat', 'gps_lat', 'start_latitude'];
const LNG_ALIASES = ['lon', 'lng', 'longitude', 'position_lon', 'gps_lon', 'gps_lng', 'start_longitude'];
const DEPTH_ALIASES = ['depth', 'depth_ft', 'depth_m', 'water_depth', 'bottom_depth', 'depth_feet', 'depth_meters'];
const TEMP_ALIASES = ['water_temp', 'watertemp', 'temp', 'temperature', 'water_temperature', 'temp_f', 'temp_c'];
const TIME_ALIASES = ['time', 'timestamp', 'datetime', 'date', 'utc_time', 'gps_time'];

const METERS_DEPTH = new Set(['depth_m', 'depth_meters']);
const CELSIUS_TEMP = new Set(['temp_c']);

function matchColumn(header, aliases) {
  const h = header.toLowerCase().trim();
  return aliases.find((a) => h === a) || null;
}

function detectColumns(headers) {
  const mapping = { lat: -1, lng: -1, depth: -1, temp: -1, time: -1 };
  const meta = { depthInMeters: false, tempInCelsius: false };

  headers.forEach((raw, i) => {
    const h = raw.toLowerCase().trim();
    if (mapping.lat === -1 && matchColumn(h, LAT_ALIASES)) mapping.lat = i;
    if (mapping.lng === -1 && matchColumn(h, LNG_ALIASES)) mapping.lng = i;
    if (mapping.depth === -1 && matchColumn(h, DEPTH_ALIASES)) {
      mapping.depth = i;
      meta.depthInMeters = METERS_DEPTH.has(h);
    }
    if (mapping.temp === -1 && matchColumn(h, TEMP_ALIASES)) {
      mapping.temp = i;
      meta.tempInCelsius = CELSIUS_TEMP.has(h);
    }
    if (mapping.time === -1 && matchColumn(h, TIME_ALIASES)) mapping.time = i;
  });

  return { mapping, meta };
}

function metersToFeet(m) {
  return m * 3.28084;
}

function celsiusToFahrenheit(c) {
  return c * 9 / 5 + 32;
}

/**
 * Parse a CSV string into depth point objects.
 * Returns { points: [], warnings: [], columnMapping: {} }
 */
export function parseCSV(text, filename = 'file.csv') {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) {
    return { points: [], warnings: ['File is empty or has no data rows'], columnMapping: null };
  }

  const separator = lines[0].includes('\t') ? '\t' : ',';
  const headers = lines[0].split(separator);
  const { mapping, meta } = detectColumns(headers);

  if (mapping.lat === -1 || mapping.lng === -1) {
    return { points: [], warnings: ['Could not detect latitude/longitude columns'], columnMapping: null };
  }
  if (mapping.depth === -1) {
    return { points: [], warnings: ['Could not detect a depth column'], columnMapping: null };
  }

  const columnMapping = {
    lat: headers[mapping.lat],
    lng: headers[mapping.lng],
    depth: headers[mapping.depth],
    temp: mapping.temp !== -1 ? headers[mapping.temp] : null,
    time: mapping.time !== -1 ? headers[mapping.time] : null,
  };

  const points = [];
  const warnings = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(separator);
    const lat = parseFloat(cols[mapping.lat]);
    const lng = parseFloat(cols[mapping.lng]);
    let depth = parseFloat(cols[mapping.depth]);

    if (isNaN(lat) || isNaN(lng) || isNaN(depth)) {
      warnings.push(`Row ${i + 1}: skipped (invalid lat/lng/depth)`);
      continue;
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      warnings.push(`Row ${i + 1}: skipped (coordinates out of range)`);
      continue;
    }

    if (meta.depthInMeters) depth = metersToFeet(depth);
    if (depth < 0) depth = Math.abs(depth);

    let waterTemp = null;
    if (mapping.temp !== -1) {
      const t = parseFloat(cols[mapping.temp]);
      if (!isNaN(t)) {
        waterTemp = meta.tempInCelsius ? celsiusToFahrenheit(t) : t;
      }
    }

    let timestamp = null;
    if (mapping.time !== -1 && cols[mapping.time]?.trim()) {
      timestamp = cols[mapping.time].trim();
    }

    points.push({ lat, lng, depth: Math.round(depth * 10) / 10, waterTemp, timestamp, source: filename });
  }

  if (points.length === 0 && warnings.length === 0) {
    warnings.push('No valid depth points found in file');
  }

  return { points, warnings, columnMapping };
}

/**
 * Parse a GPX XML string into depth point objects.
 * Looks for depth in <extensions>, falls back to negative <ele>.
 * Returns { points: [], warnings: [] }
 */
export function parseGPX(text, filename = 'file.gpx') {
  const warnings = [];
  let xmlDoc;
  try {
    xmlDoc = new DOMParser().parseFromString(text, 'text/xml');
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      return { points: [], warnings: ['Invalid GPX/XML file'] };
    }
  } catch {
    return { points: [], warnings: ['Failed to parse GPX file'] };
  }

  const points = [];

  // Collect all trackpoints and waypoints
  const elements = [
    ...xmlDoc.getElementsByTagName('trkpt'),
    ...xmlDoc.getElementsByTagName('wpt'),
  ];

  for (const el of elements) {
    const lat = parseFloat(el.getAttribute('lat'));
    const lng = parseFloat(el.getAttribute('lon'));
    if (isNaN(lat) || isNaN(lng)) continue;

    // Try to find depth from extensions (vendor-agnostic)
    let depth = null;
    let waterTemp = null;

    const extensions = el.getElementsByTagName('extensions')[0];
    if (extensions) {
      // Look for depth element anywhere in extensions
      const depthEl = extensions.querySelector('depth') ||
        [...extensions.children].find((c) => c.localName === 'depth');
      if (depthEl) {
        const d = parseFloat(depthEl.textContent);
        if (!isNaN(d)) depth = metersToFeet(d);
      }

      // Look for water temp
      const tempEl = extensions.querySelector('watertemp, water_temp, WaterTemp') ||
        [...extensions.children].find((c) =>
          ['watertemp', 'water_temp', 'watertemperature'].includes(c.localName.toLowerCase())
        );
      if (tempEl) {
        const t = parseFloat(tempEl.textContent);
        if (!isNaN(t)) waterTemp = celsiusToFahrenheit(t);
      }
    }

    // Fallback: negative elevation = underwater depth
    if (depth === null) {
      const eleEl = el.getElementsByTagName('ele')[0];
      if (eleEl) {
        const ele = parseFloat(eleEl.textContent);
        if (!isNaN(ele) && ele < 0) {
          depth = metersToFeet(Math.abs(ele));
        }
      }
    }

    if (depth === null) continue;
    if (depth < 0) depth = Math.abs(depth);

    // Try to get timestamp
    let timestamp = null;
    const timeEl = el.getElementsByTagName('time')[0];
    if (timeEl?.textContent) {
      timestamp = timeEl.textContent.trim();
    }

    points.push({
      lat,
      lng,
      depth: Math.round(depth * 10) / 10,
      waterTemp: waterTemp !== null ? Math.round(waterTemp * 10) / 10 : null,
      timestamp,
      source: filename,
    });
  }

  if (points.length === 0) {
    warnings.push('No depth data found in GPX file. Ensure trackpoints have depth extensions or negative elevation values.');
  }

  return { points, warnings };
}

/**
 * Detect file format and parse accordingly.
 */
export function parseSonarFile(text, filename) {
  const ext = filename.toLowerCase().split('.').pop();
  if (ext === 'gpx' || ext === 'xml') {
    return parseGPX(text, filename);
  }
  return parseCSV(text, filename);
}

/**
 * Compute summary stats for an array of depth points.
 */
export function computeStats(points) {
  if (points.length === 0) return null;
  const depths = points.map((p) => p.depth);
  const temps = points.filter((p) => p.waterTemp !== null).map((p) => p.waterTemp);
  return {
    count: points.length,
    minDepth: Math.min(...depths),
    maxDepth: Math.max(...depths),
    avgDepth: Math.round((depths.reduce((a, b) => a + b, 0) / depths.length) * 10) / 10,
    hasTemp: temps.length > 0,
    avgTemp: temps.length > 0 ? Math.round((temps.reduce((a, b) => a + b, 0) / temps.length) * 10) / 10 : null,
  };
}
