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
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=5`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const stateName = data.address?.state;
    if (!stateName) return null;
    const code = STATE_NAME_TO_CODE[stateName.toLowerCase()];
    return code || null;
  } catch {
    return null;
  }
}
