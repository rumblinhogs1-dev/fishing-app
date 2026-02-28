/**
 * Static coordinate lookup for Utah stocked waters.
 * Coordinates for popular DWR-stocked lakes, reservoirs, rivers, and urban ponds.
 */
const UT_WATERS = {
  // Major reservoirs
  'strawberry reservoir': { lat: 40.1700, lng: -111.1500 },
  'flaming gorge reservoir': { lat: 40.9200, lng: -109.4200 },
  'bear lake': { lat: 41.9500, lng: -111.3200 },
  'jordanelle reservoir': { lat: 40.6000, lng: -111.4200 },
  'deer creek reservoir': { lat: 40.4100, lng: -111.5200 },
  'starvation reservoir': { lat: 40.1900, lng: -110.4500 },
  'east canyon reservoir': { lat: 40.9000, lng: -111.5900 },
  'rockport reservoir': { lat: 40.7800, lng: -111.3800 },
  'echo reservoir': { lat: 40.9600, lng: -111.4300 },
  'causey reservoir': { lat: 41.2800, lng: -111.5700 },
  'pineview reservoir': { lat: 41.2500, lng: -111.7700 },
  'lost creek reservoir': { lat: 41.0400, lng: -111.4600 },
  'willard bay reservoir': { lat: 41.3700, lng: -112.0800 },
  'mantua reservoir': { lat: 41.5100, lng: -111.9400 },
  'hyrum reservoir': { lat: 41.6200, lng: -111.8600 },
  'porcupine reservoir': { lat: 41.8300, lng: -111.6400 },
  'newton reservoir': { lat: 41.8700, lng: -111.9800 },
  'cutler reservoir': { lat: 41.8300, lng: -111.9100 },
  'electric lake': { lat: 39.6500, lng: -111.1700 },
  'scofield reservoir': { lat: 39.7800, lng: -111.1400 },
  'huntington reservoir': { lat: 39.5600, lng: -111.2300 },
  'cleveland reservoir': { lat: 39.5700, lng: -111.2700 },
  'miller flat reservoir': { lat: 39.5500, lng: -111.2600 },
  'joe valley reservoir': { lat: 39.3000, lng: -111.3000 },
  'red fleet reservoir': { lat: 40.5700, lng: -109.4700 },
  'steinaker reservoir': { lat: 40.5200, lng: -109.5400 },
  'matt warner reservoir': { lat: 40.7800, lng: -109.2400 },
  'calder reservoir': { lat: 40.7100, lng: -109.2100 },
  'crouse reservoir': { lat: 40.7500, lng: -109.2500 },
  'moon lake': { lat: 40.5700, lng: -110.4900 },
  'currant creek reservoir': { lat: 40.2300, lng: -111.0600 },
  'mill meadow reservoir': { lat: 38.4300, lng: -111.5100 },
  'forsyth reservoir': { lat: 38.4600, lng: -111.5900 },
  'piute reservoir': { lat: 38.3200, lng: -112.1500 },
  'otter creek reservoir': { lat: 38.2500, lng: -111.9500 },
  'fish lake': { lat: 38.5700, lng: -111.7000 },
  'johnson reservoir': { lat: 38.5400, lng: -111.6900 },
  'panguitch lake': { lat: 37.7200, lng: -112.6400 },
  'navajo lake': { lat: 37.5200, lng: -112.7900 },
  'kolob reservoir': { lat: 37.4300, lng: -113.0400 },
  'enterprise reservoir': { lat: 37.5700, lng: -113.7100 },
  'baker reservoir': { lat: 37.4700, lng: -113.3100 },
  'minersville reservoir': { lat: 38.2100, lng: -112.9100 },
  'wide hollow reservoir': { lat: 37.7700, lng: -111.6100 },
  'barker reservoir': { lat: 38.0700, lng: -111.5200 },
  'lower bowns reservoir': { lat: 38.0700, lng: -111.4600 },
  'quail creek reservoir': { lat: 37.2100, lng: -113.3800 },
  'sand hollow reservoir': { lat: 37.1200, lng: -113.3700 },
  'gunlock reservoir': { lat: 37.3000, lng: -113.7700 },
  'yuba reservoir': { lat: 39.3700, lng: -111.9100 },
  'sevier bridge reservoir': { lat: 39.3700, lng: -111.9100 },
  'pelican lake': { lat: 40.2000, lng: -109.6700 },
  'lake powell': { lat: 37.0700, lng: -111.2500 },
  'utah lake': { lat: 40.2300, lng: -111.7700 },

  // Rivers and streams
  'provo river': { lat: 40.5200, lng: -111.4800 },
  'provo river lower': { lat: 40.3300, lng: -111.6300 },
  'provo river middle': { lat: 40.5200, lng: -111.4800 },
  'provo river upper': { lat: 40.6600, lng: -111.1400 },
  'green river': { lat: 39.0200, lng: -110.1500 },
  'green river a section': { lat: 40.9100, lng: -109.4300 },
  'green river b section': { lat: 40.8700, lng: -109.4000 },
  'green river c section': { lat: 40.8200, lng: -109.3600 },
  'logan river': { lat: 41.7400, lng: -111.7800 },
  'weber river': { lat: 40.8600, lng: -111.5200 },
  'weber river lower': { lat: 41.1600, lng: -111.9400 },
  'ogden river': { lat: 41.2400, lng: -111.9700 },
  'south fork ogden river': { lat: 41.2500, lng: -111.7700 },
  'blacksmith fork river': { lat: 41.6600, lng: -111.7800 },
  'left hand fork blacksmith fork': { lat: 41.6200, lng: -111.6900 },
  'whitefish creek': { lat: 41.7400, lng: -111.6700 },
  'bear river': { lat: 41.5000, lng: -111.9400 },
  'chalk creek': { lat: 40.9200, lng: -111.3300 },
  'diamond fork creek': { lat: 40.0900, lng: -111.3700 },
  'spanish fork river': { lat: 40.1100, lng: -111.6000 },
  'american fork creek': { lat: 40.4300, lng: -111.6300 },
  'hobble creek': { lat: 40.1700, lng: -111.6000 },
  'duchesne river': { lat: 40.3000, lng: -110.3900 },
  'strawberry river': { lat: 40.1800, lng: -110.9400 },
  'lake fork river': { lat: 40.4100, lng: -110.4600 },
  'yellowstone river': { lat: 40.5100, lng: -110.5700 },
  'rock creek': { lat: 40.5700, lng: -110.5400 },
  'uinta river': { lat: 40.5300, lng: -110.0300 },
  'whiterocks river': { lat: 40.5600, lng: -109.9300 },
  'fremont river': { lat: 38.4500, lng: -111.5600 },
  'beaver river': { lat: 38.2800, lng: -112.6400 },
  'east fork sevier river': { lat: 37.8200, lng: -112.0600 },
  'sevier river': { lat: 38.8000, lng: -112.0700 },
  'mammoth creek': { lat: 37.6700, lng: -112.4800 },
  'asay creek': { lat: 37.6400, lng: -112.4300 },
  'santa clara river': { lat: 37.3000, lng: -113.6700 },
  'virgin river': { lat: 37.2000, lng: -113.2900 },
  'cottonwood creek': { lat: 39.6100, lng: -111.2400 },

  // Urban ponds — Salt Lake County
  'salem pond': { lat: 40.0500, lng: -111.6700 },
  'spring lake': { lat: 40.0700, lng: -111.6700 },
  'highland glen park pond': { lat: 40.4200, lng: -111.7900 },
  'murray park pond': { lat: 40.6300, lng: -111.8800 },
  'bountiful lake': { lat: 40.8700, lng: -111.8700 },
  'riverton city pond': { lat: 40.5200, lng: -111.9400 },
  'herriman city pond': { lat: 40.5100, lng: -112.0300 },
  'bluffdale city pond': { lat: 40.4800, lng: -111.9400 },
  'millrace park pond': { lat: 40.6100, lng: -111.8700 },
  'westpointe pond': { lat: 40.7000, lng: -111.9500 },
  'sugarhouse park pond': { lat: 40.7200, lng: -111.8500 },
  'liberty park pond': { lat: 40.7500, lng: -111.8700 },
  'bountiful pond': { lat: 40.8700, lng: -111.8700 },

  // Urban ponds — Utah County
  'salem mill pond': { lat: 40.0500, lng: -111.6700 },
  'spanish oaks reservoir': { lat: 40.0600, lng: -111.5700 },
  'payson city pond': { lat: 40.0400, lng: -111.7300 },
  'mapleton city pond': { lat: 40.1300, lng: -111.5700 },
  'provo city pond': { lat: 40.2200, lng: -111.6800 },
  'orem city pond': { lat: 40.3000, lng: -111.6900 },
  'lindon city pond': { lat: 40.3400, lng: -111.7200 },
  'pleasant grove pond': { lat: 40.3600, lng: -111.7400 },
  'lehi city pond': { lat: 40.3800, lng: -111.8400 },
  'saratoga springs pond': { lat: 40.3500, lng: -111.8800 },

  // Urban ponds — Weber/Davis County
  'north ogden canyon park': { lat: 41.2800, lng: -111.9600 },
  'weber county fairgrounds pond': { lat: 41.2200, lng: -111.9700 },
  'syracuse city pond': { lat: 41.0900, lng: -112.0700 },
  'layton park pond': { lat: 41.0600, lng: -111.9600 },
  'farmington pond': { lat: 40.9800, lng: -111.8900 },
  'kaysville city pond': { lat: 41.0400, lng: -111.9400 },
  'centerville city pond': { lat: 40.9200, lng: -111.8800 },

  // Urban ponds — Cache County
  'logan city pond': { lat: 41.7300, lng: -111.8300 },
  'smithfield city pond': { lat: 41.8400, lng: -111.8300 },
  'cache county fairgrounds pond': { lat: 41.7100, lng: -111.8100 },

  // Urban ponds — Iron/Washington County
  'cedar city pond': { lat: 37.6800, lng: -113.0600 },
  'st. george city pond': { lat: 37.1000, lng: -113.5800 },
  'washington city pond': { lat: 37.1300, lng: -113.5100 },
  'hurricane city pond': { lat: 37.1500, lng: -113.2900 },

  // Urban ponds — Other
  'price city pond': { lat: 39.6000, lng: -110.8100 },
  'vernal city pond': { lat: 40.4600, lng: -109.5300 },
  'roosevelt city pond': { lat: 40.3000, lng: -110.0100 },
  'richfield city pond': { lat: 38.7700, lng: -112.0800 },
  'ephraim city pond': { lat: 39.3600, lng: -111.5900 },
  'manti city pond': { lat: 39.2700, lng: -111.6300 },
  'nephi city pond': { lat: 39.7100, lng: -111.8300 },
  'tooele city pond': { lat: 40.5300, lng: -112.3000 },
  'grantsville city pond': { lat: 40.6000, lng: -112.4600 },
  'settlement canyon reservoir': { lat: 40.5000, lng: -112.3200 },
  'vernon reservoir': { lat: 40.1000, lng: -112.4300 },
  'grantsville reservoir': { lat: 40.6800, lng: -112.5000 },

  // High Uinta lakes
  'mirror lake': { lat: 40.7000, lng: -110.8900 },
  'trial lake': { lat: 40.6800, lng: -110.9500 },
  'washington lake': { lat: 40.6900, lng: -110.9300 },
  'wall lake': { lat: 40.7000, lng: -110.8600 },
  'moosehorn lake': { lat: 40.7100, lng: -110.8500 },
  'butterfly lake': { lat: 40.7100, lng: -110.9100 },
  'lofty lake': { lat: 40.6900, lng: -110.8900 },
  'teapot lake': { lat: 40.6800, lng: -110.9200 },
  'lily lake': { lat: 40.6800, lng: -110.8700 },

  // Other notable waters
  'tony grove lake': { lat: 41.8900, lng: -111.6400 },
  'monte cristo pond': { lat: 41.4600, lng: -111.5000 },
  'birch creek reservoir': { lat: 41.4900, lng: -112.0500 },
  'johnson valley reservoir': { lat: 38.5400, lng: -111.6900 },
  'matt warner': { lat: 40.7800, lng: -109.2400 },
  'bullock reservoir': { lat: 41.3500, lng: -112.0400 },
  'mantua': { lat: 41.5100, lng: -111.9400 },
  'pine valley reservoir': { lat: 37.3800, lng: -113.4800 },
  'yankee meadow reservoir': { lat: 37.8200, lng: -112.8400 },
  'paragonah reservoir': { lat: 37.8900, lng: -112.7700 },
  'duck fork reservoir': { lat: 39.3200, lng: -111.2700 },
  'ferron reservoir': { lat: 39.1200, lng: -111.3700 },
  'twelve mile flat reservoirs': { lat: 39.0800, lng: -111.4200 },
  'thousand lake mountain': { lat: 38.4200, lng: -111.5000 },
  'boulder mountain lakes': { lat: 38.0500, lng: -111.4500 },
  'henry mountains ponds': { lat: 37.8500, lng: -110.7700 },
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
  if (UT_WATERS[lower]) return UT_WATERS[lower];

  // Substring match (input contains a known water name)
  for (const [key, coords] of Object.entries(UT_WATERS)) {
    if (lower.includes(key) || key.includes(lower)) return coords;
  }

  // Word overlap — require at least 2 matching words
  const words = lower.split(/\s+/).filter((w) => w.length > 2);
  let bestMatch = null;
  let bestScore = 0;
  for (const [key, coords] of Object.entries(UT_WATERS)) {
    const keyWords = key.split(/\s+/);
    const overlap = words.filter((w) => keyWords.some((kw) => kw.includes(w) || w.includes(kw))).length;
    if (overlap > bestScore && overlap >= 2) {
      bestScore = overlap;
      bestMatch = coords;
    }
  }

  return bestMatch;
}

export default UT_WATERS;
