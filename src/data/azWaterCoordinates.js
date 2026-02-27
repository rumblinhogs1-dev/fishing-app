/**
 * Static coordinate lookup for Arizona community fishing waters and stocked lakes.
 * These are fixed public waters — no runtime geocoding needed.
 */
const AZ_WATERS = {
  // Phoenix Metro
  'canal park': { lat: 33.4373, lng: -111.9170 },
  'chaparral lake': { lat: 33.4601, lng: -111.8935 },
  'cortez lake': { lat: 33.5784, lng: -112.2227 },
  'desert breeze lake': { lat: 33.3770, lng: -111.8590 },
  'desert west lake': { lat: 33.4750, lng: -112.2940 },
  'encanto lake': { lat: 33.4730, lng: -112.0840 },
  'evelyn hallman pond': { lat: 33.3559, lng: -111.7870 },
  'freestone park lake': { lat: 33.3050, lng: -111.7200 },
  'kiwanis lake': { lat: 33.4108, lng: -111.9399 },
  'papago ponds': { lat: 33.4530, lng: -111.9490 },
  'red mountain lake': { lat: 33.5370, lng: -111.7170 },
  'rio vista pond': { lat: 33.4130, lng: -111.7590 },
  'riverview lake': { lat: 33.4310, lng: -111.8570 },
  'steele indian school lake': { lat: 33.4960, lng: -112.0710 },
  'tempe town lake': { lat: 33.4314, lng: -111.8880 },
  'water ranch lake': { lat: 33.3040, lng: -111.7530 },

  // East Valley / Gilbert / Chandler
  'alvord lake': { lat: 33.2970, lng: -111.8110 },
  'veterans oasis lake': { lat: 33.2660, lng: -111.7440 },
  'surprise lake': { lat: 33.6310, lng: -112.3670 },

  // Tucson Area
  'kennedy lake': { lat: 32.2340, lng: -110.9000 },
  'lakeside lake': { lat: 32.2560, lng: -110.8540 },
  'silverbell lake': { lat: 32.2870, lng: -111.0220 },
  'sahuarita lake': { lat: 31.9350, lng: -110.9540 },

  // Flagstaff / Northern AZ
  'frances short pond': { lat: 35.2010, lng: -111.6410 },
  'city reservoir': { lat: 35.2180, lng: -111.6390 },
  'lakes mary': { lat: 35.0690, lng: -111.5000 },
  'upper lake mary': { lat: 35.0690, lng: -111.5000 },
  'lower lake mary': { lat: 35.1090, lng: -111.5200 },
  'ashurst lake': { lat: 34.9990, lng: -111.3960 },
  'kinnikinick lake': { lat: 34.8790, lng: -111.3830 },
  'mormon lake': { lat: 34.9390, lng: -111.4610 },
  'marshall lake': { lat: 35.1000, lng: -111.3900 },
  'rogers lake': { lat: 35.2640, lng: -111.7870 },

  // Payson / Rim Country
  'green valley lake': { lat: 34.2420, lng: -111.3260 },
  'woods canyon lake': { lat: 34.3340, lng: -110.9560 },
  'willow springs lake': { lat: 34.3430, lng: -110.9080 },
  'bear canyon lake': { lat: 34.3530, lng: -110.8720 },
  'knoll lake': { lat: 34.4090, lng: -111.0780 },
  'black canyon lake': { lat: 34.3180, lng: -110.9620 },
  'chevelon canyon lake': { lat: 34.4480, lng: -110.8390 },
  'rim lake': { lat: 34.3200, lng: -110.9270 },
  'tonto creek': { lat: 34.2530, lng: -111.3090 },

  // Show Low / Pinetop / White Mountains
  'fool hollow lake': { lat: 34.2710, lng: -110.0970 },
  'show low lake': { lat: 34.2210, lng: -110.0180 },
  'scott reservoir': { lat: 34.2530, lng: -109.9640 },
  'rainbow lake': { lat: 34.1490, lng: -109.9630 },
  'woodland lake': { lat: 34.1260, lng: -109.9360 },
  'big lake': { lat: 33.8720, lng: -109.4150 },
  'crescent lake': { lat: 33.8890, lng: -109.4610 },
  'lee valley lake': { lat: 33.9190, lng: -109.4840 },
  'luna lake': { lat: 33.8340, lng: -109.0910 },
  'nelson reservoir': { lat: 33.8300, lng: -109.2400 },
  'becker lake': { lat: 33.8940, lng: -109.3430 },
  'bunch reservoir': { lat: 33.9040, lng: -109.4080 },
  'river reservoir': { lat: 33.8850, lng: -109.5060 },
  'carnero lake': { lat: 33.8760, lng: -109.5850 },

  // Prescott Area
  'goldwater lake': { lat: 34.5090, lng: -112.4410 },
  'watson lake': { lat: 34.5830, lng: -112.4260 },
  'lynx lake': { lat: 34.5320, lng: -112.3830 },
  'willow lake': { lat: 34.5940, lng: -112.4410 },
  'fain lake': { lat: 34.6530, lng: -112.3280 },
  'mingus lake': { lat: 34.6690, lng: -112.1070 },

  // Southeast / Safford
  'dankworth pond': { lat: 32.8170, lng: -109.6870 },
  'roper lake': { lat: 32.7630, lng: -109.6960 },
  'riggs flat lake': { lat: 32.7080, lng: -109.8620 },

  // Yuma Area
  'yuma west wetlands': { lat: 32.7260, lng: -114.6320 },

  // Colorado River
  'lake havasu': { lat: 34.4730, lng: -114.3410 },
  'lake mohave': { lat: 35.2050, lng: -114.6330 },
  'lake mead': { lat: 36.1450, lng: -114.3900 },
  'lake powell': { lat: 37.0700, lng: -111.2420 },
  'lake pleasant': { lat: 33.8670, lng: -112.2680 },

  // Salt River / Roosevelt
  'roosevelt lake': { lat: 33.6690, lng: -111.1510 },
  'apache lake': { lat: 33.5690, lng: -111.2560 },
  'canyon lake': { lat: 33.5320, lng: -111.4200 },
  'saguaro lake': { lat: 33.5640, lng: -111.5270 },
  'bartlett lake': { lat: 33.8170, lng: -111.6340 },
  'horseshoe lake': { lat: 33.9520, lng: -111.7170 },

  // Verde River
  'dead horse ranch pond': { lat: 34.7590, lng: -112.0090 },

  // Other
  'parker canyon lake': { lat: 31.4290, lng: -110.4570 },
  'patagonia lake': { lat: 31.4860, lng: -110.8450 },
  'pena blanca lake': { lat: 31.3990, lng: -111.0730 },
  'rose canyon lake': { lat: 32.3870, lng: -110.7120 },
  'point of pines lake': { lat: 33.4020, lng: -109.7590 },
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
  if (AZ_WATERS[lower]) return AZ_WATERS[lower];

  // Substring match (input contains a known water name)
  for (const [key, coords] of Object.entries(AZ_WATERS)) {
    if (lower.includes(key) || key.includes(lower)) return coords;
  }

  // Word overlap — require at least 2 matching words
  const words = lower.split(/\s+/).filter((w) => w.length > 2);
  let bestMatch = null;
  let bestScore = 0;
  for (const [key, coords] of Object.entries(AZ_WATERS)) {
    const keyWords = key.split(/\s+/);
    const overlap = words.filter((w) => keyWords.some((kw) => kw.includes(w) || w.includes(kw))).length;
    if (overlap > bestScore && overlap >= 2) {
      bestScore = overlap;
      bestMatch = coords;
    }
  }

  return bestMatch;
}

export default AZ_WATERS;
