/**
 * Static coordinate lookup for Maryland stocked waters.
 * These are fixed public waters — no runtime geocoding needed.
 */
const MD_WATERS = {
  // Western Maryland
  'north branch potomac': { lat: 39.4680, lng: -79.0620 },
  'savage river': { lat: 39.5120, lng: -79.1270 },
  'casselman river': { lat: 39.7150, lng: -79.1540 },
  'youghiogheny river': { lat: 39.6380, lng: -79.3960 },
  'bear creek': { lat: 39.5730, lng: -79.1240 },
  'evitts creek': { lat: 39.6440, lng: -78.7320 },
  'fifteen mile creek': { lat: 39.6430, lng: -78.3900 },
  'licking creek': { lat: 39.6920, lng: -77.8650 },
  'town creek': { lat: 39.6180, lng: -78.5310 },
  'dans mountain pond': { lat: 39.6560, lng: -78.8610 },
  'new germany lake': { lat: 39.6270, lng: -79.1170 },
  'herrington lake': { lat: 39.5940, lng: -79.0510 },

  // Central Maryland
  'big gunpowder falls': { lat: 39.4930, lng: -76.6320 },
  'little gunpowder falls': { lat: 39.5250, lng: -76.5150 },
  'patapsco river': { lat: 39.2800, lng: -76.7470 },
  'patuxent river': { lat: 39.1280, lng: -76.8240 },
  'morgan run': { lat: 39.4060, lng: -76.9620 },
  'liberty reservoir': { lat: 39.4150, lng: -76.8980 },
  'prettyboy reservoir': { lat: 39.5660, lng: -76.7340 },
  'loch raven reservoir': { lat: 39.4580, lng: -76.5750 },
  'piney run reservoir': { lat: 39.4040, lng: -76.9770 },
  'centennial lake': { lat: 39.2340, lng: -76.8600 },
  'lake elkhorn': { lat: 39.1930, lng: -76.8190 },
  'lake kittamaqundi': { lat: 39.2070, lng: -76.8510 },

  // Frederick / Washington County
  'catoctin creek': { lat: 39.3460, lng: -77.5250 },
  'fishing creek': { lat: 39.6320, lng: -77.4560 },
  'big hunting creek': { lat: 39.6370, lng: -77.4690 },
  'owens creek': { lat: 39.6550, lng: -77.3880 },
  'middle creek': { lat: 39.6420, lng: -77.4310 },
  'frank bentz pond': { lat: 39.6410, lng: -77.4020 },
  'cunningham falls lake': { lat: 39.6330, lng: -77.4380 },
  'greenbrier lake': { lat: 39.6650, lng: -77.6180 },

  // Eastern Shore
  'unicorn lake': { lat: 38.9590, lng: -76.0930 },
  'tuckahoe creek': { lat: 38.9670, lng: -75.9460 },

  // Southern Maryland
  'allen pond': { lat: 38.9500, lng: -76.7190 },
  'schoolhouse pond': { lat: 38.8060, lng: -76.8800 },
  'st marys lake': { lat: 38.2740, lng: -76.6670 },
};

export default MD_WATERS;
