import stateRegulations from '../data/stateRegulations';

// Map US state name to abbreviation
const STATE_NAME_TO_CODE = {};
Object.entries(stateRegulations).forEach(([code, data]) => {
  STATE_NAME_TO_CODE[data.state.toLowerCase()] = code;
});

export function lookupByState(stateCode) {
  return stateRegulations[stateCode?.toUpperCase()] || null;
}

export function lookupByStateName(stateName) {
  if (!stateName) return null;
  const code = STATE_NAME_TO_CODE[stateName.toLowerCase()];
  return code ? stateRegulations[code] : null;
}

export function lookupBySpecies(stateCode, speciesName) {
  const stateData = lookupByState(stateCode);
  if (!stateData) return null;
  const lower = speciesName.toLowerCase();
  return stateData.species.find((s) => s.name.toLowerCase().includes(lower)) || null;
}

export async function detectStateFromGPS(lat, lng) {
  const res = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
  );
  if (!res.ok) throw new Error(`Reverse geocoding failed (${res.status})`);
  const data = await res.json();
  if (data.countryCode !== 'US') throw new Error('Location appears to be outside the United States.');
  const stateName = data.principalSubdivision;
  if (!stateName) throw new Error('Could not determine state from your location.');
  const code = STATE_NAME_TO_CODE[stateName.toLowerCase()];
  if (!code) throw new Error(`State "${stateName}" is not yet supported.`);
  return code;
}
