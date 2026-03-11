/**
 * Static coordinate lookup for Montana stocked waters.
 * These are fixed public waters — no runtime geocoding needed.
 */
const MT_WATERS = {
  // Western Montana
  'georgetown lake': { lat: 46.2190, lng: -113.2980 },
  'seeley lake': { lat: 47.1800, lng: -113.4870 },
  'placid lake': { lat: 47.1430, lng: -113.5270 },
  'salmon lake': { lat: 47.1530, lng: -113.4690 },
  'lake como': { lat: 46.0590, lng: -114.2310 },
  'painted rocks reservoir': { lat: 45.7920, lng: -114.0330 },
  'lake mary ronan': { lat: 47.7360, lng: -114.1140 },
  'echo lake': { lat: 48.0580, lng: -114.0520 },
  'whitefish lake': { lat: 48.4230, lng: -114.3570 },
  'thompson falls reservoir': { lat: 47.5910, lng: -115.3380 },
  'noxon rapids reservoir': { lat: 47.7430, lng: -115.7420 },
  'clark fork river': { lat: 46.8720, lng: -113.9940 },
  'bitterroot river': { lat: 46.4370, lng: -114.0790 },
  'blackfoot river': { lat: 46.9650, lng: -113.3570 },
  'rock creek': { lat: 46.6780, lng: -113.6840 },
  'big hole river': { lat: 45.7340, lng: -113.3160 },

  // Southwest Montana
  'ruby river reservoir': { lat: 45.2100, lng: -112.2270 },
  'clark canyon reservoir': { lat: 44.9450, lng: -112.8410 },
  'lima reservoir': { lat: 44.6090, lng: -112.6650 },
  'canyon ferry reservoir': { lat: 46.6640, lng: -111.7280 },
  'hauser lake': { lat: 46.7750, lng: -111.8320 },
  'holter lake': { lat: 46.8550, lng: -112.0150 },
  'hebgen lake': { lat: 44.7660, lng: -111.3210 },
  'quake lake': { lat: 44.8300, lng: -111.4460 },
  'wade lake': { lat: 44.7820, lng: -111.5990 },
  'cliff lake': { lat: 44.7470, lng: -111.5770 },
  'willow creek reservoir': { lat: 45.7820, lng: -112.0750 },
  'madison river': { lat: 45.3140, lng: -111.6510 },
  'gallatin river': { lat: 45.5760, lng: -111.1920 },
  'jefferson river': { lat: 45.8740, lng: -112.0430 },
  'missouri river': { lat: 46.6220, lng: -111.9630 },
  'ruby river': { lat: 45.3280, lng: -112.1950 },
  'beaverhead river': { lat: 45.1270, lng: -112.6510 },

  // Central Montana
  'ackley lake': { lat: 47.0890, lng: -110.2160 },
  'spring creek': { lat: 46.5780, lng: -110.5970 },
  'smith river': { lat: 46.8810, lng: -111.0540 },
  'belt creek': { lat: 47.3420, lng: -110.9200 },
  'sluice boxes state park': { lat: 47.2460, lng: -110.7180 },

  // Eastern Montana
  'fort peck reservoir': { lat: 47.5540, lng: -106.9560 },
  'nelson reservoir': { lat: 48.5130, lng: -108.5210 },
  'fresno reservoir': { lat: 48.5950, lng: -109.5870 },
  'tongue river reservoir': { lat: 45.1810, lng: -106.2030 },
  'yellowstone river': { lat: 45.7830, lng: -108.5130 },
  'bighorn river': { lat: 45.6890, lng: -107.9620 },

  // Northwest Montana / Glacier
  'flathead lake': { lat: 47.8810, lng: -114.1300 },
  'hungry horse reservoir': { lat: 48.2300, lng: -113.9890 },
  'ashley lake': { lat: 48.1780, lng: -114.6440 },
  'tally lake': { lat: 48.3670, lng: -114.5730 },
  'lake koocanusa': { lat: 48.7550, lng: -115.2270 },
  'thompson lake': { lat: 48.0290, lng: -115.0240 },
  'swan river': { lat: 47.5180, lng: -113.7210 },
  'flathead river': { lat: 48.2280, lng: -114.2850 },
  'swan lake': { lat: 47.9220, lng: -113.8550 },
  'lake elmo': { lat: 45.8240, lng: -108.4600 },
  'daily lake': { lat: 45.8350, lng: -111.9780 },
};

export default MT_WATERS;
