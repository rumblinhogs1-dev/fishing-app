/**
 * Static coordinate lookup for Virginia stocked waters.
 * These are fixed public waters — no runtime geocoding needed.
 */
const VA_WATERS = {
  // Blue Ridge / Shenandoah Valley
  'south river': { lat: 38.0670, lng: -79.0940 },
  'north river': { lat: 38.3560, lng: -79.1830 },
  'jackson river': { lat: 37.7860, lng: -79.9260 },
  'back creek': { lat: 38.0370, lng: -79.8120 },
  'bullpasture river': { lat: 38.2380, lng: -79.6180 },
  'mossy creek': { lat: 38.3180, lng: -79.1580 },
  'buffalo creek': { lat: 37.6580, lng: -79.7130 },
  'st marys river': { lat: 37.9310, lng: -79.0670 },
  'pedlar river': { lat: 37.7540, lng: -79.3050 },
  'irish creek': { lat: 37.8050, lng: -79.3720 },
  'jennings creek': { lat: 37.5580, lng: -79.6230 },
  'north creek': { lat: 37.5940, lng: -79.6020 },
  'south fork shenandoah': { lat: 38.6490, lng: -78.5410 },
  'north fork shenandoah': { lat: 38.7940, lng: -78.6510 },

  // Southwest Virginia
  'new river': { lat: 37.0430, lng: -80.7020 },
  'south fork holston': { lat: 36.7360, lng: -81.9230 },
  'north fork holston': { lat: 36.8490, lng: -82.0760 },
  'whitetop laurel creek': { lat: 36.6590, lng: -81.6120 },
  'big wilson creek': { lat: 36.6420, lng: -81.5360 },
  'stony creek': { lat: 37.3430, lng: -80.6210 },
  'big stony creek': { lat: 37.3170, lng: -80.5940 },
  'dismal creek': { lat: 37.2370, lng: -80.8750 },
  'little stony creek': { lat: 37.3260, lng: -80.5450 },
  'helton creek': { lat: 36.6530, lng: -81.4830 },
  'roaring fork': { lat: 36.7760, lng: -81.5250 },
  'big reed island creek': { lat: 36.8540, lng: -80.6330 },
  'peak creek': { lat: 37.0370, lng: -80.7550 },
  'wolf creek': { lat: 37.2680, lng: -80.8320 },

  // Central Virginia
  'james river': { lat: 37.5280, lng: -79.4400 },
  'rivanna river': { lat: 38.0330, lng: -78.5080 },
  'hardware river': { lat: 37.8130, lng: -78.6330 },
  'rockfish river': { lat: 37.8430, lng: -78.8520 },
  'tye river': { lat: 37.7430, lng: -79.0280 },
  'mechums river': { lat: 38.0690, lng: -78.6740 },

  // Northern Virginia / Piedmont
  'rapidan river': { lat: 38.3810, lng: -78.3350 },
  'rappahannock river': { lat: 38.4720, lng: -78.1420 },
  'robinson river': { lat: 38.4860, lng: -78.3230 },
  'rose river': { lat: 38.5440, lng: -78.4130 },
  'conway river': { lat: 38.4060, lng: -78.4220 },
  'hughes river': { lat: 38.6130, lng: -78.3570 },
  'hazel river': { lat: 38.6340, lng: -78.2680 },
  'thornton river': { lat: 38.6780, lng: -78.1820 },
  'passage creek': { lat: 38.8780, lng: -78.3330 },

  // Stocked ponds / urban
  'pandapas pond': { lat: 37.2740, lng: -80.4770 },
  'douthat lake': { lat: 37.8940, lng: -79.8040 },
  'sherando lake': { lat: 37.9190, lng: -79.0270 },
  'lake moomaw': { lat: 37.9240, lng: -79.9680 },
  'philpott reservoir': { lat: 36.7880, lng: -80.0250 },
  'south holston lake': { lat: 36.5800, lng: -82.0320 },
  'hungry mother lake': { lat: 36.8840, lng: -81.5290 },
  'claytor lake': { lat: 37.0650, lng: -80.6260 },
  'rural retreat lake': { lat: 36.8910, lng: -81.2720 },
  'bark camp lake': { lat: 36.9280, lng: -82.4290 },
  'laurel bed lake': { lat: 37.0780, lng: -81.4370 },
  'hidden valley lake': { lat: 37.6400, lng: -79.9600 },
  'elkhorn lake': { lat: 37.6310, lng: -79.8290 },
};

export default VA_WATERS;
