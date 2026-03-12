/**
 * Static coordinate lookup for West Virginia stocked waters.
 * These are fixed public waters — no runtime geocoding needed.
 */
const WV_WATERS = {
  // Eastern Panhandle
  'south branch potomac': { lat: 38.8930, lng: -79.2260 },
  'north fork south branch': { lat: 38.9240, lng: -79.3340 },
  'seneca creek': { lat: 38.8260, lng: -79.8060 },
  'cranberry river': { lat: 38.2890, lng: -80.3790 },
  'williams river': { lat: 38.3310, lng: -80.3250 },
  'elk river': { lat: 38.4640, lng: -80.5770 },
  'shavers fork': { lat: 38.6940, lng: -79.8440 },
  'dry fork': { lat: 38.8920, lng: -79.5920 },
  'blackwater river': { lat: 39.0680, lng: -79.4420 },
  'cheat river': { lat: 39.2440, lng: -79.6650 },
  'glady fork': { lat: 38.7830, lng: -79.7050 },
  'laurel fork': { lat: 38.7170, lng: -79.7280 },
  'red creek': { lat: 38.9390, lng: -79.6250 },
  'north fork cherry river': { lat: 38.3520, lng: -80.5020 },

  // Southern WV
  'greenbrier river': { lat: 37.8110, lng: -80.4520 },
  'anthony creek': { lat: 38.0210, lng: -80.1380 },
  'second creek': { lat: 37.6730, lng: -80.4920 },
  'meadow river': { lat: 38.0310, lng: -80.8390 },
  'bluestone river': { lat: 37.5640, lng: -80.8580 },
  'new river': { lat: 37.8130, lng: -80.8960 },
  'glade creek': { lat: 37.8550, lng: -80.9950 },
  'piney creek': { lat: 37.9700, lng: -80.8980 },

  // Northern WV
  'buffalo creek': { lat: 39.4640, lng: -80.2780 },
  'west fork river': { lat: 39.2850, lng: -80.3420 },
  'tygart valley river': { lat: 39.1130, lng: -80.0200 },
  'buckhannon river': { lat: 38.9950, lng: -80.2320 },
  'middle fork river': { lat: 38.9720, lng: -80.1150 },
  'leading creek': { lat: 38.9140, lng: -80.1930 },

  // Stocked Lakes & Ponds
  'spruce knob lake': { lat: 38.7020, lng: -79.5400 },
  'stonewall jackson lake': { lat: 38.9660, lng: -80.4080 },
  'burnsville lake': { lat: 38.8540, lng: -80.6370 },
  'sutton lake': { lat: 38.6660, lng: -80.6970 },
  'summersville lake': { lat: 38.2290, lng: -80.8610 },
  'bluestone lake': { lat: 37.6310, lng: -80.8710 },
  'r d bailey lake': { lat: 37.5820, lng: -81.8140 },
  'stonecoal lake': { lat: 39.0750, lng: -80.4400 },
  'beech fork lake': { lat: 38.2790, lng: -82.2880 },
  'east lynn lake': { lat: 38.1580, lng: -82.3490 },
  'mountwood lake': { lat: 39.2740, lng: -81.4670 },
  'north bend lake': { lat: 39.1370, lng: -80.9570 },
  'watoga lake': { lat: 38.0890, lng: -80.1150 },
  'trout pond': { lat: 38.9210, lng: -79.1750 },
  'summit lake': { lat: 38.2520, lng: -80.4330 },
};

export default WV_WATERS;
