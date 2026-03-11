/**
 * Static coordinate lookup for Michigan stocked waters.
 * These are fixed public waters — no runtime geocoding needed.
 */
const MI_WATERS = {
  // Upper Peninsula
  'lake gogebic': { lat: 46.4890, lng: -89.5780 },
  'lake michigamme': { lat: 46.5320, lng: -88.0150 },
  'lake superior': { lat: 46.7580, lng: -87.3210 },
  'manistique lake': { lat: 46.1310, lng: -85.8870 },
  'brevort lake': { lat: 46.0210, lng: -85.2090 },
  'indian lake': { lat: 46.1350, lng: -86.2870 },
  'paint river': { lat: 46.1400, lng: -88.6430 },
  'iron river': { lat: 46.0930, lng: -88.6430 },
  'menominee river': { lat: 45.5230, lng: -87.6100 },
  'au train river': { lat: 46.4140, lng: -86.8290 },
  'tahquamenon river': { lat: 46.5830, lng: -85.2320 },

  // Northern Lower Peninsula
  'lake charlevoix': { lat: 45.2420, lng: -85.2300 },
  'lake bellaire': { lat: 44.9790, lng: -85.2110 },
  'torch lake': { lat: 44.9510, lng: -85.3350 },
  'crystal lake': { lat: 44.6190, lng: -86.0530 },
  'glen lake': { lat: 44.8720, lng: -86.0150 },
  'platte river': { lat: 44.6680, lng: -86.0820 },
  'betsie river': { lat: 44.5990, lng: -86.0060 },
  'boardman river': { lat: 44.7470, lng: -85.6200 },
  'pere marquette river': { lat: 43.9420, lng: -86.2920 },
  'manistee river': { lat: 44.2470, lng: -86.2920 },
  'au sable river': { lat: 44.4060, lng: -84.0380 },
  'muskegon river': { lat: 43.6440, lng: -85.9130 },
  'grayling': { lat: 44.6620, lng: -84.7140 },
  'houghton lake': { lat: 44.3190, lng: -84.7610 },
  'higgins lake': { lat: 44.4590, lng: -84.7090 },
  'lake cadillac': { lat: 44.2510, lng: -85.4010 },
  'lake mitchell': { lat: 44.2260, lng: -85.4250 },
  'otsego lake': { lat: 44.9310, lng: -84.5950 },

  // Southern Lower Peninsula
  'grand river': { lat: 42.9640, lng: -85.6680 },
  'kalamazoo river': { lat: 42.2860, lng: -85.5870 },
  'st joseph river': { lat: 41.9490, lng: -86.2570 },
  'rogue river': { lat: 43.1220, lng: -85.6750 },
  'flat river': { lat: 43.0850, lng: -85.2510 },
  'thornapple river': { lat: 42.8760, lng: -85.4520 },
  'gun lake': { lat: 42.4320, lng: -85.3890 },
  'gull lake': { lat: 42.3970, lng: -85.4080 },
  'lake lansing': { lat: 42.7870, lng: -84.4070 },
  'huron river': { lat: 42.2840, lng: -83.7450 },
  'portage lake': { lat: 42.4120, lng: -83.9060 },
  'union lake': { lat: 42.6040, lng: -83.4250 },
  'kent lake': { lat: 42.5170, lng: -83.6490 },
  'lake erie metropark': { lat: 42.0690, lng: -83.1900 },
  'lake st clair': { lat: 42.4290, lng: -82.7530 },

  // Popular stocking destinations
  'harrietta state fish hatchery': { lat: 44.3140, lng: -85.6930 },
  'wolf lake state fish hatchery': { lat: 42.2810, lng: -85.5880 },
  'oden state fish hatchery': { lat: 45.3600, lng: -84.8590 },
  'thompson state fish hatchery': { lat: 44.3510, lng: -85.5350 },
  'platte river state fish hatchery': { lat: 44.7190, lng: -86.0750 },
};

export default MI_WATERS;
