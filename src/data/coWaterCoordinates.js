/**
 * Static coordinate lookup for Colorado stocked waters.
 * These are fixed public waters — no runtime geocoding needed.
 */
const CO_WATERS = {
  // Front Range — Denver Metro
  'aurora reservoir': { lat: 39.6181, lng: -104.7488 },
  'bear creek lake': { lat: 39.6350, lng: -105.1430 },
  'chatfield reservoir': { lat: 39.5350, lng: -105.0730 },
  'cherry creek reservoir': { lat: 39.6320, lng: -104.8530 },
  'quincy reservoir': { lat: 39.6370, lng: -104.8100 },
  'marston reservoir': { lat: 39.6160, lng: -105.0240 },
  'sloan lake': { lat: 39.7530, lng: -105.0350 },
  'wash park - grasmere lake': { lat: 39.6970, lng: -104.9730 },
  'wash park - smith lake': { lat: 39.6940, lng: -104.9730 },
  'garfield lake': { lat: 39.7700, lng: -105.0100 },
  'rocky mountain lake': { lat: 39.7780, lng: -105.0350 },
  'berkeley lake': { lat: 39.7780, lng: -105.0450 },
  'ferril lake': { lat: 39.7480, lng: -104.9540 },
  'soda lakes': { lat: 39.5430, lng: -105.1360 },

  // Front Range — North
  'boyd lake': { lat: 40.4290, lng: -105.0630 },
  'horsetooth reservoir': { lat: 40.5510, lng: -105.1700 },
  'carter lake': { lat: 40.3650, lng: -105.2030 },
  'lon hagler reservoir': { lat: 40.4100, lng: -105.0770 },
  'flatiron reservoir': { lat: 40.3800, lng: -105.1700 },
  'pinewood reservoir': { lat: 40.3570, lng: -105.2370 },
  'benson lake': { lat: 40.4840, lng: -105.0250 },
  'sheldon lake': { lat: 40.5770, lng: -105.0590 },
  'spring canyon reservoir': { lat: 40.5280, lng: -105.1650 },
  'warren lake': { lat: 40.4450, lng: -104.7450 },
  'st. vrain state park': { lat: 40.1710, lng: -105.0560 },
  'union reservoir': { lat: 40.1460, lng: -105.0370 },
  'walden ponds': { lat: 40.0250, lng: -105.2350 },
  'barr lake': { lat: 39.9340, lng: -104.7550 },
  'baseline reservoir': { lat: 39.9880, lng: -105.2530 },
  'standley lake': { lat: 39.8310, lng: -105.1100 },

  // Front Range — South
  'pueblo reservoir': { lat: 38.2650, lng: -104.8500 },
  'lake pueblo': { lat: 38.2650, lng: -104.8500 },
  'trinidad lake': { lat: 37.1130, lng: -104.6650 },
  'lathrop state park': { lat: 37.6140, lng: -104.8200 },
  'martin lake': { lat: 37.6140, lng: -104.8200 },
  'horseshoe lake': { lat: 37.6100, lng: -104.8170 },
  'fountain creek regional park': { lat: 38.7040, lng: -104.7380 },
  'prospect lake': { lat: 38.8230, lng: -104.8070 },
  'quail lake': { lat: 38.7970, lng: -104.8490 },
  'ramah reservoir': { lat: 39.1280, lng: -104.1660 },
  'skaguay reservoir': { lat: 38.4410, lng: -105.0030 },

  // Colorado Springs Area
  'monument lake': { lat: 37.2320, lng: -104.9500 },
  'north catamount reservoir': { lat: 38.8700, lng: -105.0350 },
  'south catamount reservoir': { lat: 38.8600, lng: -105.0280 },
  'crystal creek reservoir': { lat: 38.8780, lng: -105.0310 },
  'rampart reservoir': { lat: 38.9080, lng: -105.0320 },
  'eleven mile reservoir': { lat: 38.9260, lng: -105.5000 },
  'spinney mountain reservoir': { lat: 38.9800, lng: -105.4640 },

  // Mountain — Summit / Eagle / Grand
  'dillon reservoir': { lat: 39.6260, lng: -106.0580 },
  'green mountain reservoir': { lat: 39.8770, lng: -106.2830 },
  'lake granby': { lat: 40.1470, lng: -105.8680 },
  'shadow mountain reservoir': { lat: 40.2200, lng: -105.8350 },
  'grand lake': { lat: 40.2440, lng: -105.8210 },
  'meadow creek reservoir': { lat: 39.5700, lng: -106.3360 },
  'sylvan lake': { lat: 39.6190, lng: -106.8530 },
  'nottingham lake': { lat: 39.6350, lng: -106.3700 },
  'eagle river': { lat: 39.6500, lng: -106.8280 },
  'blue river': { lat: 39.5730, lng: -106.0630 },
  'williams fork reservoir': { lat: 39.9620, lng: -106.1900 },

  // Mountain — Central
  'turquoise lake': { lat: 39.2730, lng: -106.4350 },
  'twin lakes': { lat: 39.0820, lng: -106.3380 },
  'clear creek reservoir': { lat: 39.0350, lng: -106.2460 },
  'taylor reservoir': { lat: 38.8190, lng: -106.5920 },
  'taylor river': { lat: 38.8150, lng: -106.6260 },
  'spring creek reservoir': { lat: 38.1390, lng: -106.8130 },
  'monarch lake': { lat: 40.1080, lng: -105.7510 },

  // Mountain — Southwest / Gunnison
  'blue mesa reservoir': { lat: 38.4630, lng: -107.2180 },
  'morrow point reservoir': { lat: 38.4550, lng: -107.3700 },
  'crawford reservoir': { lat: 38.6870, lng: -107.6040 },
  'paonia reservoir': { lat: 38.9240, lng: -107.3440 },
  'gunnison river': { lat: 38.5530, lng: -107.3550 },
  'east river': { lat: 38.8570, lng: -106.9590 },

  // Southwest — Durango / Pagosa
  'vallecito reservoir': { lat: 37.3890, lng: -107.5620 },
  'lemon reservoir': { lat: 37.3850, lng: -107.6600 },
  'animas river': { lat: 37.2740, lng: -107.8800 },
  'san juan river': { lat: 37.0500, lng: -107.0200 },
  'navajo reservoir': { lat: 36.8090, lng: -107.6140 },
  'williams creek reservoir': { lat: 37.4850, lng: -106.9160 },
  'echo canyon reservoir': { lat: 37.0500, lng: -107.5860 },
  'haviland lake': { lat: 37.4550, lng: -107.7850 },

  // Western Slope
  'rifle gap reservoir': { lat: 39.6590, lng: -107.7120 },
  'harvey gap reservoir': { lat: 39.6590, lng: -107.6050 },
  'vega reservoir': { lat: 39.2280, lng: -107.7880 },
  'grand mesa lakes': { lat: 39.0510, lng: -107.9690 },
  'island lake': { lat: 39.0580, lng: -107.9340 },
  'ward lake': { lat: 39.0440, lng: -107.9640 },
  'highline lake': { lat: 39.2050, lng: -108.7870 },
  'connected lakes': { lat: 39.0850, lng: -108.5850 },
  'colorado river': { lat: 39.0660, lng: -108.5540 },
  'roaring fork river': { lat: 39.5440, lng: -107.3320 },
  'fryingpan river': { lat: 39.3520, lng: -106.7520 },

  // Northeast — Sterling / Greeley
  'north sterling reservoir': { lat: 40.7690, lng: -103.2470 },
  'jackson lake': { lat: 40.3820, lng: -104.0940 },
  'prewitt reservoir': { lat: 40.5550, lng: -103.4910 },
  'jumbo reservoir': { lat: 40.5370, lng: -102.6370 },
  'riverside reservoir': { lat: 40.6190, lng: -104.2160 },
  'boyd lake': { lat: 40.4290, lng: -105.0630 },

  // San Luis Valley
  'san luis lake': { lat: 37.6550, lng: -105.7110 },
  'smith reservoir': { lat: 37.3520, lng: -105.9810 },
  'mountain home reservoir': { lat: 37.3060, lng: -105.8660 },
  'sanchez reservoir': { lat: 37.0350, lng: -105.6440 },
  'rio grande river': { lat: 37.6650, lng: -106.0680 },
  'conejos river': { lat: 37.0890, lng: -106.0510 },

  // Arkansas Valley
  'arkansas river': { lat: 38.5420, lng: -106.1080 },
  'lake deweese': { lat: 38.3630, lng: -105.5000 },
  'john martin reservoir': { lat: 38.0720, lng: -102.9410 },
  'queens reservoir': { lat: 38.1030, lng: -102.9190 },
  'lake hasty': { lat: 38.0590, lng: -102.9320 },

  // Rocky Mountain National Park Area
  "mary's lake": { lat: 40.3510, lng: -105.5680 },
  'marys lake': { lat: 40.3510, lng: -105.5680 },
  'estes lake': { lat: 40.3710, lng: -105.5170 },
  'lily lake': { lat: 40.3060, lng: -105.5380 },
  'sprague lake': { lat: 40.3210, lng: -105.6080 },
  'bear lake': { lat: 40.3130, lng: -105.6480 },
  'dream lake': { lat: 40.3100, lng: -105.6600 },
  'big thompson river': { lat: 40.4200, lng: -105.2330 },
  'cache la poudre river': { lat: 40.6800, lng: -105.2210 },

  // South Platte Corridor
  'south platte river': { lat: 39.2260, lng: -105.2310 },
  'cheesman reservoir': { lat: 39.2230, lng: -105.2780 },
  'strontia springs reservoir': { lat: 39.4430, lng: -105.1060 },
  'waterton canyon': { lat: 39.4830, lng: -105.0960 },
  'deckers': { lat: 39.2670, lng: -105.2250 },
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
  if (CO_WATERS[lower]) return CO_WATERS[lower];

  // Substring match (input contains a known water name)
  for (const [key, coords] of Object.entries(CO_WATERS)) {
    if (lower.includes(key) || key.includes(lower)) return coords;
  }

  // Word overlap — require at least 2 matching words
  const words = lower.split(/\s+/).filter((w) => w.length > 2);
  let bestMatch = null;
  let bestScore = 0;
  for (const [key, coords] of Object.entries(CO_WATERS)) {
    const keyWords = key.split(/\s+/);
    const overlap = words.filter((w) => keyWords.some((kw) => kw.includes(w) || w.includes(kw))).length;
    if (overlap > bestScore && overlap >= 2) {
      bestScore = overlap;
      bestMatch = coords;
    }
  }

  return bestMatch;
}

export default CO_WATERS;
