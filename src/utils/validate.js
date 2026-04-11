export function sanitizeString(str, maxLen = 500) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen);
}

export function validateCatch(data) {
  const allowed = [
    'species', 'weight', 'length', 'lure', 'notes', 'lat', 'lng',
    'imageUrl', 'lureImage', 'visibility', 'waterBody', 'waterType',
    'weather', 'temperature', 'authorDisplayName', 'authorPhotoURL',
    // lure AI fields
    'lureName', 'lureType', 'lureCategory', 'lureColor', 'bait',
    // location / conditions
    'location', 'date', 'released',
    'weatherTemp', 'weatherWind', 'weatherPressure', 'weatherCondition', 'weatherCloudCover',
    'waterTemp', 'flowRate', 'depth', 'waterStation',
  ];
  const clean = {};
  for (const key of allowed) {
    if (data[key] !== undefined) clean[key] = data[key];
  }

  if (clean.species) clean.species = sanitizeString(clean.species, 100);
  if (clean.lure) clean.lure = sanitizeString(clean.lure, 100);
  if (clean.notes) clean.notes = sanitizeString(clean.notes, 2000);
  if (clean.waterBody) clean.waterBody = sanitizeString(clean.waterBody, 200);
  if (clean.weather) clean.weather = sanitizeString(clean.weather, 100);
  if (clean.authorDisplayName) clean.authorDisplayName = sanitizeString(clean.authorDisplayName, 100);
  if (clean.lureName) clean.lureName = sanitizeString(clean.lureName, 200);
  if (clean.lureType) clean.lureType = sanitizeString(clean.lureType, 100);
  if (clean.lureCategory) clean.lureCategory = sanitizeString(clean.lureCategory, 100);
  if (clean.lureColor) clean.lureColor = sanitizeString(clean.lureColor, 100);
  if (clean.bait) clean.bait = sanitizeString(clean.bait, 200);
  if (clean.location) clean.location = sanitizeString(clean.location, 300);

  if (clean.weight !== undefined) clean.weight = Number(clean.weight) || 0;
  if (clean.length !== undefined) clean.length = Number(clean.length) || 0;
  if (clean.temperature !== undefined) clean.temperature = Number(clean.temperature) || 0;
  if (clean.lat !== undefined) clean.lat = Number(clean.lat) || 0;
  if (clean.lng !== undefined) clean.lng = Number(clean.lng) || 0;

  if (clean.visibility && !['public', 'friends', 'private'].includes(clean.visibility)) {
    clean.visibility = 'public';
  }

  return clean;
}

export function validateSpot(data) {
  const allowed = ['name', 'lat', 'lng', 'notes', 'waterBody', 'waterType', 'visibility'];
  const clean = {};
  for (const key of allowed) {
    if (data[key] !== undefined) clean[key] = data[key];
  }

  if (clean.name) clean.name = sanitizeString(clean.name, 200);
  if (clean.notes) clean.notes = sanitizeString(clean.notes, 2000);
  if (clean.waterBody) clean.waterBody = sanitizeString(clean.waterBody, 200);
  if (clean.lat !== undefined) clean.lat = Number(clean.lat) || 0;
  if (clean.lng !== undefined) clean.lng = Number(clean.lng) || 0;

  return clean;
}

export function validateMessage(text) {
  if (typeof text !== 'string') return '';
  const trimmed = text.trim().slice(0, 5000);
  return trimmed;
}

export function validateComment(text) {
  if (typeof text !== 'string') return '';
  const trimmed = text.trim().slice(0, 2000);
  return trimmed;
}

export function validatePassword(password) {
  const errors = [];
  if (password.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('One number');
  return { valid: errors.length === 0, errors };
}
