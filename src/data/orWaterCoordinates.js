/**
 * Static coordinate lookup for Oregon stocked waters.
 * These are fixed public waters — no runtime geocoding needed.
 */
const OR_WATERS = {
  // Willamette Valley
  'cottage grove res': { lat: 43.7190, lng: -122.9470 },
  'dexter res': { lat: 43.9170, lng: -122.8100 },
  'detroit lake': { lat: 44.7190, lng: -122.1530 },
  'dorena res': { lat: 43.7820, lng: -122.9560 },
  'fall creek res': { lat: 43.9310, lng: -122.7340 },
  'fern ridge res': { lat: 44.0320, lng: -123.2970 },
  'foster res': { lat: 44.4060, lng: -122.6680 },
  'green peter res': { lat: 44.4510, lng: -122.5560 },
  'henry hagg lake': { lat: 45.4690, lng: -123.2040 },
  'hills cr res': { lat: 43.7070, lng: -122.4290 },
  'lookout point res': { lat: 43.9040, lng: -122.7430 },
  'mt hood pd': { lat: 45.3570, lng: -122.6080 },
  'north fork res': { lat: 43.9700, lng: -122.2460 },
  'huddleston pd': { lat: 45.3230, lng: -122.7670 },
  'st louis ponds': { lat: 44.9510, lng: -123.0970 },
  'silver creek res': { lat: 44.8380, lng: -122.3760 },
  'timber linn lake': { lat: 44.6260, lng: -122.9020 },
  'walter wirth lake': { lat: 44.9120, lng: -122.9840 },
  'waverly lake': { lat: 44.6340, lng: -122.8870 },
  'willamette river': { lat: 44.9430, lng: -123.0350 },

  // Central Oregon
  'crane prairie res': { lat: 43.7890, lng: -121.7780 },
  'crooked river': { lat: 44.2970, lng: -120.9100 },
  'cultus lake': { lat: 43.8620, lng: -121.8540 },
  'davis lake': { lat: 43.5960, lng: -121.8120 },
  'deschutes river': { lat: 44.3440, lng: -121.1670 },
  'east lake': { lat: 43.7190, lng: -121.2100 },
  'elk lake': { lat: 43.9570, lng: -121.7930 },
  'fall river': { lat: 43.7840, lng: -121.6130 },
  'hosmer lake': { lat: 43.9700, lng: -121.7680 },
  'lava lake': { lat: 43.9120, lng: -121.7690 },
  'metolius river': { lat: 44.5630, lng: -121.6120 },
  'north twin lake': { lat: 43.7310, lng: -121.7580 },
  'ochoco res': { lat: 44.2770, lng: -120.7010 },
  'paulina lake': { lat: 43.7200, lng: -121.2730 },
  'prineville res': { lat: 44.1800, lng: -120.7640 },
  'south twin lake': { lat: 43.7180, lng: -121.7530 },
  'sparks lake': { lat: 44.0040, lng: -121.7330 },
  'suttle lake': { lat: 44.4140, lng: -121.7350 },
  'todd lake': { lat: 44.0340, lng: -121.6910 },
  'walton lake': { lat: 44.3200, lng: -120.4520 },
  'wickiup res': { lat: 43.6750, lng: -121.7710 },

  // Southern Oregon
  'applegate lake': { lat: 42.0680, lng: -123.0570 },
  'diamond lake': { lat: 43.1690, lng: -122.1500 },
  'emigrant lake': { lat: 42.1440, lng: -122.6080 },
  'fish lake': { lat: 42.3740, lng: -122.3590 },
  'howard prairie lake': { lat: 42.2210, lng: -122.3700 },
  'hyatt lake': { lat: 42.1710, lng: -122.4520 },
  'lake of the woods': { lat: 42.3650, lng: -122.2000 },
  'lemolo lake': { lat: 43.3190, lng: -122.1950 },
  'lost creek lake': { lat: 42.6580, lng: -122.6650 },
  'rogue river': { lat: 42.4280, lng: -123.3350 },
  'umpqua river': { lat: 43.2940, lng: -123.4320 },
  'upper klamath lake': { lat: 42.5030, lng: -121.8860 },

  // Northwest / Coast
  'cape meares lake': { lat: 45.4720, lng: -123.9420 },
  'cleawox lake': { lat: 43.9020, lng: -124.1420 },
  'coffenbury lake': { lat: 46.1510, lng: -123.9570 },
  'eel lake': { lat: 43.5790, lng: -124.1760 },
  'lost lake': { lat: 45.4990, lng: -121.8170 },
  'olalla res': { lat: 45.3120, lng: -123.1100 },
  'siltcoos lake': { lat: 43.8580, lng: -124.1340 },
  'tahkenitch lake': { lat: 43.7930, lng: -124.1490 },
  'tenmile lake': { lat: 43.5620, lng: -124.1840 },
  'thissel pd': { lat: 44.6250, lng: -124.0040 },
  'vernonia lake': { lat: 45.8580, lng: -123.1800 },

  // Eastern Oregon
  'ana res': { lat: 42.9800, lng: -120.7780 },
  'anthony lake': { lat: 44.9610, lng: -118.2310 },
  'beulah res': { lat: 43.9380, lng: -118.0910 },
  'chickahominy res': { lat: 43.5250, lng: -119.6500 },
  'malheur res': { lat: 43.9780, lng: -118.1600 },
  'owyhee res': { lat: 43.6090, lng: -117.2440 },
  'phillips res': { lat: 44.7320, lng: -118.0540 },
  'unity res': { lat: 44.4780, lng: -118.1870 },
  'wallowa lake': { lat: 45.2750, lng: -117.2110 },

  // Northeast Oregon
  'grande ronde river': { lat: 45.3200, lng: -117.9150 },
  'imnaha river': { lat: 45.5560, lng: -116.8200 },
  'john day river': { lat: 44.7310, lng: -119.0100 },
  'magone lake': { lat: 44.5300, lng: -118.9200 },
};

export default OR_WATERS;
