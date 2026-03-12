/**
 * Static coordinate lookup for South Carolina stocked waters.
 * These are fixed public waters — no runtime geocoding needed.
 */
const SC_WATERS = {
  // Upstate / Blue Ridge
  'chattooga river': { lat: 34.8210, lng: -83.3150 },
  'chauga river': { lat: 34.7550, lng: -83.1540 },
  'eastatoe creek': { lat: 35.0190, lng: -82.8890 },
  'laurel fork creek': { lat: 35.0120, lng: -82.8690 },
  'whitewater river': { lat: 35.0250, lng: -82.9600 },
  'matthews creek': { lat: 34.8890, lng: -83.0950 },
  'king creek': { lat: 34.8420, lng: -83.1170 },
  'east fork chattooga': { lat: 35.0050, lng: -83.1340 },
  'howard creek': { lat: 34.9370, lng: -83.0280 },

  // Piedmont Tailwaters
  'saluda river': { lat: 34.0560, lng: -81.1970 },
  'lower saluda river': { lat: 33.9960, lng: -81.0870 },
  'broad river': { lat: 34.4090, lng: -81.4160 },
  'pacolet river': { lat: 34.8560, lng: -81.7640 },
  'tyger river': { lat: 34.6720, lng: -81.8060 },
  'enoree river': { lat: 34.5640, lng: -81.7130 },
  'reedy river': { lat: 34.8430, lng: -82.3990 },

  // Stocked Lakes
  'lake jocassee': { lat: 34.9630, lng: -82.9290 },
  'table rock reservoir': { lat: 35.0440, lng: -82.6890 },
  'lake keowee': { lat: 34.8250, lng: -82.8710 },
  'lake hartwell': { lat: 34.4530, lng: -82.8210 },
  'lake murray': { lat: 34.0680, lng: -81.2440 },
  'lake greenwood': { lat: 34.1830, lng: -81.8630 },
  'lake robinson': { lat: 34.4370, lng: -80.1510 },
  'clarks hill lake': { lat: 33.6620, lng: -82.1960 },

  // Community Stocking Sites
  'dolly cooper park pond': { lat: 34.5080, lng: -82.4730 },
  'sandy beach waterfowl area': { lat: 34.0680, lng: -80.9350 },
  'sesquicentennial state park': { lat: 34.0870, lng: -80.9070 },
  'conestee park lake': { lat: 34.7830, lng: -82.3590 },
};

export default SC_WATERS;
