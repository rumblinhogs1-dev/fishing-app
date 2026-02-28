/**
 * Static coordinate lookup for Idaho stocked waters.
 * Coordinates for popular IDFG-stocked lakes, reservoirs, rivers, and urban ponds.
 */
const ID_WATERS = {
  // Major rivers
  'snake river': { lat: 43.5900, lng: -115.9700 },
  'snake river - south fork': { lat: 43.4900, lng: -111.6200 },
  'south fork snake river': { lat: 43.4900, lng: -111.6200 },
  'salmon river': { lat: 45.1800, lng: -114.0600 },
  'middle fork salmon river': { lat: 44.7200, lng: -114.8900 },
  'clearwater river': { lat: 46.4200, lng: -116.7800 },
  'north fork clearwater river': { lat: 46.6200, lng: -115.6300 },
  'south fork clearwater river': { lat: 46.1000, lng: -115.6200 },
  'boise river': { lat: 43.6100, lng: -116.2100 },
  'south fork boise river': { lat: 43.6000, lng: -115.6900 },
  'north fork boise river': { lat: 43.8500, lng: -115.7300 },
  'middle fork boise river': { lat: 43.7100, lng: -115.4500 },
  "henry's fork": { lat: 44.4900, lng: -111.3800 },
  "henry's fork snake river": { lat: 44.4900, lng: -111.3800 },
  'teton river': { lat: 43.8200, lng: -111.2800 },
  'big wood river': { lat: 43.3600, lng: -114.3500 },
  'little wood river': { lat: 43.2800, lng: -114.0900 },
  'silver creek': { lat: 43.3000, lng: -114.1400 },
  'big lost river': { lat: 43.9600, lng: -113.6100 },
  'lochsa river': { lat: 46.4000, lng: -115.2000 },
  'selway river': { lat: 46.0500, lng: -115.2500 },
  'st. joe river': { lat: 47.2500, lng: -116.2600 },
  'coeur d\'alene river': { lat: 47.5500, lng: -116.1800 },
  'priest river': { lat: 48.1800, lng: -116.8900 },
  'payette river': { lat: 44.0800, lng: -116.1200 },
  'north fork payette river': { lat: 44.7800, lng: -116.0500 },
  'south fork payette river': { lat: 43.9500, lng: -115.7500 },
  'weiser river': { lat: 44.2500, lng: -116.9700 },
  'lemhi river': { lat: 45.0000, lng: -113.5000 },
  'pahsimeroi river': { lat: 44.7700, lng: -113.8000 },
  'bruneau river': { lat: 42.7800, lng: -115.7900 },
  'owyhee river': { lat: 42.7500, lng: -116.1000 },
  'portneuf river': { lat: 42.8600, lng: -112.4500 },
  'bear river': { lat: 42.3200, lng: -111.3200 },
  'henrys lake outlet': { lat: 44.6100, lng: -111.3800 },

  // Major lakes and reservoirs
  'redfish lake': { lat: 44.1400, lng: -114.9200 },
  'alturas lake': { lat: 43.9400, lng: -114.8600 },
  'pettit lake': { lat: 43.9800, lng: -114.8800 },
  'stanley lake': { lat: 44.2200, lng: -115.0600 },
  'payette lake': { lat: 44.9800, lng: -116.0900 },
  'lucky peak reservoir': { lat: 43.5300, lng: -116.0500 },
  'anderson ranch reservoir': { lat: 43.3500, lng: -115.4800 },
  'arrowrock reservoir': { lat: 43.6000, lng: -115.9200 },
  'cj strike reservoir': { lat: 42.9500, lng: -115.8200 },
  'c.j. strike reservoir': { lat: 42.9500, lng: -115.8200 },
  'deadwood reservoir': { lat: 44.3000, lng: -115.6300 },
  'cascade reservoir': { lat: 44.5100, lng: -116.0500 },
  'lake cascade': { lat: 44.5100, lng: -116.0500 },
  'warm lake': { lat: 44.6500, lng: -115.6800 },
  'henrys lake': { lat: 44.6100, lng: -111.3800 },
  "henry's lake": { lat: 44.6100, lng: -111.3800 },
  'island park reservoir': { lat: 44.4200, lng: -111.3900 },
  'lake lowell': { lat: 43.5500, lng: -116.6200 },
  'coeur d\'alene lake': { lat: 47.5500, lng: -116.7700 },
  'lake coeur d\'alene': { lat: 47.5500, lng: -116.7700 },
  'priest lake': { lat: 48.4600, lng: -116.8500 },
  'pend oreille lake': { lat: 48.1800, lng: -116.5300 },
  'lake pend oreille': { lat: 48.1800, lng: -116.5300 },
  'hayden lake': { lat: 47.7700, lng: -116.7500 },
  'spirit lake': { lat: 47.9700, lng: -116.8700 },
  'twin lakes': { lat: 47.8500, lng: -116.8500 },
  'fernan lake': { lat: 47.6700, lng: -116.6800 },
  'dworshak reservoir': { lat: 46.5200, lng: -115.9500 },
  'magic reservoir': { lat: 43.2800, lng: -114.3700 },
  'mormon reservoir': { lat: 43.0500, lng: -114.2200 },
  'salmon falls creek reservoir': { lat: 42.2800, lng: -114.7700 },
  'american falls reservoir': { lat: 42.8000, lng: -112.8700 },
  'blackfoot reservoir': { lat: 42.7800, lng: -111.6800 },
  'chesterfield reservoir': { lat: 42.8200, lng: -111.9400 },
  'daniels reservoir': { lat: 42.6000, lng: -112.3600 },
  'bear lake': { lat: 42.0300, lng: -111.3200 },
  'ririe reservoir': { lat: 43.5800, lng: -111.7700 },
  'mackay reservoir': { lat: 43.9200, lng: -113.6200 },
  'little payette lake': { lat: 44.9600, lng: -116.1000 },
  'horsethief reservoir': { lat: 44.1200, lng: -116.5300 },
  'paddock valley reservoir': { lat: 44.3100, lng: -116.5400 },
  'sage hen reservoir': { lat: 44.3600, lng: -116.4300 },
  'lake walcott': { lat: 42.6700, lng: -113.4000 },
  'milner reservoir': { lat: 42.5300, lng: -114.0200 },
  'strike reservoir': { lat: 42.9500, lng: -115.8200 },
  'c j strike reservoir': { lat: 42.9500, lng: -115.8200 },
  'brownlee reservoir': { lat: 44.8200, lng: -116.9000 },
  'oxbow reservoir': { lat: 44.9700, lng: -116.8400 },
  'hells canyon reservoir': { lat: 45.2400, lng: -116.7000 },
  'sublett reservoir': { lat: 42.3500, lng: -113.0200 },

  // Sawtooth Valley lakes
  'yellow belly lake': { lat: 44.0200, lng: -115.0000 },
  'petit lake': { lat: 43.9800, lng: -114.8800 },
  'hell roaring lake': { lat: 44.0900, lng: -114.9800 },
  'alpine lake': { lat: 44.0600, lng: -115.0500 },

  // Mountain lakes — Central Idaho
  'warm springs creek': { lat: 43.7300, lng: -114.3500 },
  'north fork big wood river': { lat: 43.5800, lng: -114.4200 },
  'boulder chain lakes': { lat: 43.9800, lng: -114.7500 },
  'baker lake': { lat: 44.2400, lng: -114.6000 },

  // Panhandle region waters
  'hauser lake': { lat: 47.7700, lng: -116.8100 },
  'medicine lake': { lat: 47.9200, lng: -116.5800 },
  'kelso lake': { lat: 48.3600, lng: -116.8400 },
  'upper priest lake': { lat: 48.6800, lng: -116.8800 },
  'round lake': { lat: 48.2300, lng: -116.6100 },
  'cocolalla lake': { lat: 48.1000, lng: -116.6600 },

  // Urban ponds — Ada County (Boise metro)
  'settlers pond': { lat: 43.5900, lng: -116.3100 },
  'esther simplot park pond': { lat: 43.6100, lng: -116.2200 },
  'julius m. kleiner memorial park pond': { lat: 43.5900, lng: -116.3500 },
  'kleiner park pond': { lat: 43.5900, lng: -116.3500 },
  'meridian pond': { lat: 43.6100, lng: -116.3900 },
  'wilson springs pond': { lat: 43.6400, lng: -116.3000 },
  'eagle island pond': { lat: 43.6900, lng: -116.3800 },
  'eagle island state park pond': { lat: 43.6900, lng: -116.3800 },
  'veterans memorial park pond': { lat: 43.6200, lng: -116.2000 },
  'quinn pond': { lat: 43.5900, lng: -116.2700 },

  // Urban ponds — Canyon County
  'nampa pond': { lat: 43.5400, lng: -116.5600 },
  'caldwell pond': { lat: 43.6600, lng: -116.6900 },
  'wilson ponds': { lat: 43.5400, lng: -116.5800 },
  'lakeview park pond': { lat: 43.5600, lng: -116.5600 },

  // Urban ponds — Twin Falls area
  'dierkes lake': { lat: 42.5900, lng: -114.3200 },
  'murtaugh lake': { lat: 42.4900, lng: -114.1700 },
  'twin falls city pond': { lat: 42.5600, lng: -114.4600 },

  // Urban ponds — Bonneville County (Idaho Falls area)
  'idaho falls city pond': { lat: 43.4900, lng: -112.0400 },
  'freeman park pond': { lat: 43.4800, lng: -112.0300 },
  'ryder park pond': { lat: 43.5000, lng: -112.0600 },
  'tautphaus park pond': { lat: 43.4800, lng: -112.0300 },

  // Urban ponds — Bannock County (Pocatello area)
  'pocatello pond': { lat: 42.8700, lng: -112.4400 },
  'edson fichter pond': { lat: 42.8500, lng: -112.4200 },
  'ross park pond': { lat: 42.8600, lng: -112.4400 },

  // Urban ponds — Kootenai County
  'fernan pond': { lat: 47.6700, lng: -116.6800 },
  'blue lake': { lat: 47.7200, lng: -116.7800 },

  // Urban ponds — Latah County
  'spring valley reservoir': { lat: 46.6700, lng: -116.8900 },
  'moscow city pond': { lat: 46.7300, lng: -116.9900 },

  // Urban ponds — Nez Perce County
  'lewiston pond': { lat: 46.4200, lng: -116.9800 },
  'hells gate state park pond': { lat: 46.3900, lng: -117.0000 },

  // Eastern Idaho waters
  'grays lake': { lat: 42.9200, lng: -111.3800 },
  'palisades reservoir': { lat: 43.3200, lng: -111.2200 },
  'mesa falls': { lat: 44.1900, lng: -111.3400 },
  'warm river': { lat: 44.1200, lng: -111.3200 },
  'fall river': { lat: 44.1000, lng: -111.3100 },
  'market lake': { lat: 43.7300, lng: -112.3200 },
  'mud lake': { lat: 43.8400, lng: -112.3600 },
  'camas creek': { lat: 43.8000, lng: -112.8000 },
  'medicine lodge creek': { lat: 44.2100, lng: -112.2800 },
  'birch creek': { lat: 44.3000, lng: -112.9600 },

  // South-central Idaho
  'balanced rock pond': { lat: 42.6200, lng: -114.9800 },
  'banbury springs': { lat: 42.7200, lng: -114.8000 },
  'billingsley creek': { lat: 42.8100, lng: -114.8100 },
  'riley creek': { lat: 42.8000, lng: -114.7600 },
  'crystal springs': { lat: 42.6900, lng: -114.8200 },
  'niagara springs': { lat: 42.7200, lng: -114.8600 },
  'thousand springs': { lat: 42.7300, lng: -114.8100 },
  'hagerman fish hatchery': { lat: 42.7900, lng: -114.8900 },

  // Southwest Idaho
  'crane falls reservoir': { lat: 42.9500, lng: -115.9500 },
  'indian creek reservoir': { lat: 43.3400, lng: -116.5900 },
  'strike dam': { lat: 42.9500, lng: -115.8200 },

  // Salmon region
  'williams lake': { lat: 45.1300, lng: -113.9200 },
  'alturas lake creek': { lat: 43.9200, lng: -114.8500 },
  'yankee fork salmon river': { lat: 44.3500, lng: -114.6800 },
  'valley creek': { lat: 44.2000, lng: -114.9300 },
  'east fork salmon river': { lat: 44.1200, lng: -114.2800 },
  'panther creek': { lat: 45.1200, lng: -114.1600 },
  'morgan creek': { lat: 44.7700, lng: -114.0200 },

  // McCall area
  'upper payette lake': { lat: 45.0500, lng: -116.1200 },
  'boulder lake': { lat: 44.8400, lng: -115.8700 },
  'louie lake': { lat: 44.7500, lng: -115.7200 },
  'brundage reservoir': { lat: 44.9200, lng: -116.2200 },
  'goose lake': { lat: 44.8400, lng: -116.2000 },

  // Southeast Idaho
  'treasureton reservoir': { lat: 42.2100, lng: -111.8700 },
  'glendale reservoir': { lat: 42.4300, lng: -111.4800 },
  'thomas fork bear river': { lat: 42.2800, lng: -111.1600 },
  'mink creek': { lat: 42.7200, lng: -112.2300 },
  'travertine pond': { lat: 42.6900, lng: -111.6100 },
};

/**
 * Look up coordinates for a water body name.
 * Uses fuzzy matching: tries exact, then substring, then word overlap.
 */
export function getWaterCoordinates(name) {
  if (!name) return null;
  const lower = name.toLowerCase().trim()
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Exact match
  if (ID_WATERS[lower]) return ID_WATERS[lower];

  // Substring match (input contains a known water name)
  for (const [key, coords] of Object.entries(ID_WATERS)) {
    if (lower.includes(key) || key.includes(lower)) return coords;
  }

  // Word overlap — require at least 2 matching words
  const words = lower.split(/\s+/).filter((w) => w.length > 2);
  let bestMatch = null;
  let bestScore = 0;
  for (const [key, coords] of Object.entries(ID_WATERS)) {
    const keyWords = key.split(/\s+/);
    const overlap = words.filter((w) => keyWords.some((kw) => kw.includes(w) || w.includes(kw))).length;
    if (overlap > bestScore && overlap >= 2) {
      bestScore = overlap;
      bestMatch = coords;
    }
  }

  return bestMatch;
}

export default ID_WATERS;
