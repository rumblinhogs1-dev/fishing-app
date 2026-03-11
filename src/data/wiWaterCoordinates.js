/**
 * Static coordinate lookup for Wisconsin stocked waters.
 * These are fixed public waters — no runtime geocoding needed.
 */
const WI_WATERS = {
  // Northern Wisconsin
  'lake superior': { lat: 46.7620, lng: -90.8940 },
  'chequamegon bay': { lat: 46.6050, lng: -90.8190 },
  'lac courte oreilles': { lat: 45.8730, lng: -91.4590 },
  'lac du flambeau': { lat: 45.9580, lng: -89.8870 },
  'big st germain lake': { lat: 45.9050, lng: -89.5310 },
  'trout lake': { lat: 46.0510, lng: -89.6540 },
  'tomahawk lake': { lat: 45.8130, lng: -89.7080 },
  'pelican lake': { lat: 45.5330, lng: -89.1920 },
  'minocqua lake': { lat: 45.8780, lng: -89.7100 },
  'willow flowage': { lat: 45.7360, lng: -89.8020 },
  'flambeau river': { lat: 45.6210, lng: -90.0150 },
  'chippewa river': { lat: 44.9360, lng: -91.3920 },
  'namekagon river': { lat: 46.0610, lng: -91.1270 },
  'bois brule river': { lat: 46.5370, lng: -91.5980 },
  'prairie river': { lat: 45.3080, lng: -89.4530 },

  // Central Wisconsin
  'castle rock lake': { lat: 43.8530, lng: -89.9490 },
  'petenwell lake': { lat: 44.0280, lng: -89.9180 },
  'lake dubay': { lat: 44.6380, lng: -89.5890 },
  'lake wausau': { lat: 44.9440, lng: -89.6180 },
  'big eau pleine reservoir': { lat: 44.7700, lng: -89.9530 },
  'wisconsin river': { lat: 43.7870, lng: -89.7630 },
  'wolf river': { lat: 44.6280, lng: -88.8570 },
  'tomorrow river': { lat: 44.5110, lng: -89.3020 },

  // Southern Wisconsin
  'lake mendota': { lat: 43.1070, lng: -89.4200 },
  'lake monona': { lat: 43.0630, lng: -89.3600 },
  'lake wingra': { lat: 43.0530, lng: -89.4200 },
  'lake waubesa': { lat: 43.0010, lng: -89.3400 },
  'lake kegonsa': { lat: 42.9600, lng: -89.2380 },
  'lake geneva': { lat: 42.5870, lng: -88.4330 },
  'delavan lake': { lat: 42.6100, lng: -88.6260 },
  'devils lake': { lat: 43.4130, lng: -89.7220 },
  'yahara river': { lat: 43.0400, lng: -89.3990 },
  'sugar river': { lat: 42.7540, lng: -89.3660 },
  'pecatonica river': { lat: 42.6310, lng: -89.8510 },
  'kickapoo river': { lat: 43.2930, lng: -90.6340 },
  'black earth creek': { lat: 43.1350, lng: -89.6690 },
  'mount vernon creek': { lat: 43.0190, lng: -89.6270 },

  // Eastern Wisconsin
  'lake michigan': { lat: 43.9590, lng: -87.5180 },
  'green bay': { lat: 44.5630, lng: -87.9950 },
  'lake winnebago': { lat: 43.8660, lng: -88.4170 },
  'lake butte des morts': { lat: 44.0650, lng: -88.4960 },
  'lake poygan': { lat: 44.0890, lng: -88.6620 },
  'fox river': { lat: 44.2640, lng: -88.4190 },
  'sheboygan river': { lat: 43.7490, lng: -87.7140 },
  'milwaukee river': { lat: 43.0460, lng: -87.9060 },
  'root river': { lat: 42.7290, lng: -87.8060 },
  'pike river': { lat: 42.6310, lng: -87.8460 },
  'kewaunee river': { lat: 44.4590, lng: -87.5070 },
  'ahnapee river': { lat: 44.6010, lng: -87.4190 },

  // Western Wisconsin
  'mississippi river': { lat: 43.8290, lng: -91.2500 },
  'st croix river': { lat: 45.0530, lng: -92.7600 },
  'red cedar river': { lat: 44.8790, lng: -91.8700 },
  'eau claire river': { lat: 44.8530, lng: -91.5040 },
  'lake wissota': { lat: 44.9380, lng: -91.3050 },
  'yellow river': { lat: 43.3720, lng: -90.3310 },
};

export default WI_WATERS;
