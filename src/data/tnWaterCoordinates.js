/**
 * Static coordinate lookup for Tennessee stocked waters.
 * These are fixed public waters — no runtime geocoding needed.
 */
const TN_WATERS = {
  // East Tennessee Tailwaters
  'clinch river': { lat: 36.1260, lng: -84.1280 },
  'holston river': { lat: 36.5240, lng: -82.5290 },
  'south holston river': { lat: 36.5180, lng: -82.0940 },
  'watauga river': { lat: 36.3180, lng: -82.1220 },
  'hiwassee river': { lat: 35.2150, lng: -84.5930 },
  'ocoee river': { lat: 35.0940, lng: -84.5310 },
  'caney fork river': { lat: 36.1260, lng: -85.8010 },
  'elk river': { lat: 35.1580, lng: -86.2280 },
  'obey river': { lat: 36.3800, lng: -85.2700 },

  // Great Smoky Mountains Streams
  'little river': { lat: 35.6620, lng: -83.6780 },
  'little pigeon river': { lat: 35.7130, lng: -83.4880 },
  'abrams creek': { lat: 35.5940, lng: -83.8780 },
  'deep creek': { lat: 35.4570, lng: -83.4220 },
  'forney creek': { lat: 35.4830, lng: -83.5340 },
  'noland creek': { lat: 35.4730, lng: -83.4960 },
  'hazel creek': { lat: 35.4490, lng: -83.6310 },
  'eagle creek': { lat: 35.4920, lng: -83.6870 },

  // Middle Tennessee
  'center hill lake': { lat: 36.1020, lng: -85.8460 },
  'dale hollow lake': { lat: 36.5420, lng: -85.4310 },
  'tims ford lake': { lat: 35.1710, lng: -86.2710 },
  'normandy lake': { lat: 35.4400, lng: -86.2450 },
  'stones river': { lat: 35.8760, lng: -86.4470 },
  'collins river': { lat: 35.6820, lng: -85.6540 },
  'cane creek': { lat: 35.7050, lng: -85.5740 },
  'falling water river': { lat: 35.9470, lng: -85.3560 },

  // West Tennessee
  'reelfoot lake': { lat: 36.3660, lng: -89.4090 },
  'natchez trace state park lake': { lat: 35.7620, lng: -88.2710 },

  // Urban Trout Ponds
  'radnor lake': { lat: 36.0640, lng: -86.8020 },
  'shelby bottoms': { lat: 36.1830, lng: -86.7160 },
  'percy priest lake': { lat: 36.1320, lng: -86.5630 },
  'old hickory lake': { lat: 36.3060, lng: -86.5140 },
  'norris lake': { lat: 36.2580, lng: -84.0960 },
  'cherokee lake': { lat: 36.1790, lng: -83.4850 },
  'douglas lake': { lat: 35.9850, lng: -83.3160 },
  'fort patrick henry lake': { lat: 36.5080, lng: -82.4600 },
  'boone lake': { lat: 36.4200, lng: -82.4120 },
  'chilhowee lake': { lat: 35.5560, lng: -84.0200 },
  'tellico lake': { lat: 35.5570, lng: -84.2370 },
  'fontana lake': { lat: 35.4410, lng: -83.7540 },
};

export default TN_WATERS;
