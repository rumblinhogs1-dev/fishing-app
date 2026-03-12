/**
 * Static coordinate lookup for North Carolina stocked waters.
 * These are fixed public waters — no runtime geocoding needed.
 */
const NC_WATERS = {
  // Mountain Region - Delayed Harvest
  'nantahala river': { lat: 35.3360, lng: -83.5880 },
  'tuckasegee river': { lat: 35.3630, lng: -83.2270 },
  'oconaluftee river': { lat: 35.4810, lng: -83.3110 },
  'french broad river': { lat: 35.5480, lng: -82.5540 },
  'davidson river': { lat: 35.2670, lng: -82.7040 },
  'east fork french broad': { lat: 35.3050, lng: -82.7560 },
  'green river': { lat: 35.2220, lng: -82.3380 },
  'mills river': { lat: 35.3890, lng: -82.5760 },
  'south toe river': { lat: 35.7690, lng: -82.1440 },
  'cane river': { lat: 35.8110, lng: -82.3050 },
  'watauga river': { lat: 36.2280, lng: -81.6740 },
  'elk river': { lat: 36.1710, lng: -81.9020 },
  'wilson creek': { lat: 35.9640, lng: -81.7550 },
  'linville river': { lat: 35.9360, lng: -81.9130 },
  'stone mountain creek': { lat: 36.3860, lng: -81.0510 },
  'mitchell river': { lat: 36.3530, lng: -80.7310 },
  'ararat river': { lat: 36.4010, lng: -80.5510 },

  // Hatchery Supported Trout Waters
  'little river': { lat: 35.4240, lng: -83.4110 },
  'deep creek': { lat: 35.4330, lng: -83.4520 },
  'cataloochee creek': { lat: 35.6040, lng: -83.1050 },
  'big creek': { lat: 35.7490, lng: -83.1060 },
  'raven fork': { lat: 35.5120, lng: -83.3440 },
  'whitewater river': { lat: 35.0320, lng: -82.9570 },
  'cullasaja river': { lat: 35.1250, lng: -83.2310 },
  'fires creek': { lat: 35.0890, lng: -83.8060 },
  'snowbird creek': { lat: 35.3510, lng: -83.8310 },
  'north toe river': { lat: 35.9150, lng: -82.1040 },
  'big laurel creek': { lat: 35.8450, lng: -82.7060 },
  'shelton laurel creek': { lat: 35.9480, lng: -82.7530 },
  'johns river': { lat: 35.8700, lng: -81.8200 },
  'henry fork': { lat: 35.7280, lng: -81.6570 },
  'jacob fork': { lat: 35.6320, lng: -81.5250 },
  'south mountains creek': { lat: 35.5870, lng: -81.5850 },

  // Piedmont Region
  'yadkin river': { lat: 36.0960, lng: -80.2440 },
  'uwharrie river': { lat: 35.3740, lng: -80.0230 },
  'rocky river': { lat: 35.3820, lng: -80.5320 },
  'dan river': { lat: 36.5070, lng: -79.6980 },
  'mayo river': { lat: 36.5320, lng: -79.9740 },
  'haw river': { lat: 35.9070, lng: -79.2400 },

  // Stocked Lakes
  'lake james': { lat: 35.7530, lng: -81.8770 },
  'lake lure': { lat: 35.4280, lng: -82.2050 },
  'lake glenville': { lat: 35.1700, lng: -83.1400 },
  'bear lake': { lat: 35.0920, lng: -83.3580 },
  'lake santeetlah': { lat: 35.3660, lng: -83.8460 },
  'fontana lake': { lat: 35.4410, lng: -83.7540 },
  'price lake': { lat: 36.1350, lng: -81.7290 },
  'bass lake': { lat: 36.2410, lng: -81.6890 },
  'trout lake': { lat: 36.1420, lng: -81.7340 },
};

export default NC_WATERS;
