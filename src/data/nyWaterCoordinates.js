/**
 * Static coordinate lookup for New York stocked waters.
 * These are fixed public waters — no runtime geocoding needed.
 */
const NY_WATERS = {
  // Adirondacks
  'blue mountain lake': { lat: 43.8620, lng: -74.4430 },
  'brant lake': { lat: 43.6930, lng: -73.7230 },
  'canada lake': { lat: 43.1410, lng: -74.5410 },
  'cascade lake': { lat: 43.8180, lng: -74.8370 },
  'cranberry lake': { lat: 44.1770, lng: -74.8310 },
  'eighth lake': { lat: 43.7690, lng: -74.7780 },
  'forked lake': { lat: 43.8930, lng: -74.6310 },
  'fourth lake': { lat: 43.7450, lng: -74.8250 },
  'indian lake': { lat: 43.7780, lng: -74.2740 },
  'lake champlain': { lat: 44.5330, lng: -73.3470 },
  'lake colby': { lat: 44.3370, lng: -74.1600 },
  'lake durant': { lat: 43.8400, lng: -74.3930 },
  'lake flower': { lat: 44.3340, lng: -74.1300 },
  'lake george': { lat: 43.4900, lng: -73.5330 },
  'lake harris': { lat: 44.0040, lng: -74.1550 },
  'lake luzerne': { lat: 43.3180, lng: -73.8120 },
  'lake placid': { lat: 44.2890, lng: -73.9830 },
  'limekiln lake': { lat: 43.7010, lng: -74.7470 },
  'long lake': { lat: 43.9730, lng: -74.4310 },
  'loon lake': { lat: 44.0270, lng: -74.0460 },
  'meacham lake': { lat: 44.4690, lng: -74.2470 },
  'mirror lake': { lat: 44.2810, lng: -73.9770 },
  'moose river': { lat: 43.7400, lng: -74.8700 },
  'old forge pond': { lat: 43.7130, lng: -74.9720 },
  'piseco lake': { lat: 43.3530, lng: -74.5380 },
  'raquette lake': { lat: 43.8240, lng: -74.6370 },
  'sacandaga lake': { lat: 43.2970, lng: -74.2330 },
  'saranac lake': { lat: 44.3260, lng: -74.1530 },
  'schroon lake': { lat: 43.8530, lng: -73.7630 },
  'seventh lake': { lat: 43.7620, lng: -74.7520 },
  'tupper lake': { lat: 44.2310, lng: -74.4620 },

  // Catskills
  'alder lake': { lat: 42.0210, lng: -74.8490 },
  'beaverkill river': { lat: 41.9530, lng: -74.8730 },
  'east branch delaware river': { lat: 42.1070, lng: -74.8110 },
  'esopus creek': { lat: 42.0690, lng: -74.3150 },
  'neversink river': { lat: 41.7690, lng: -74.6170 },
  'pepacton reservoir': { lat: 42.0780, lng: -74.8330 },
  'schoharie creek': { lat: 42.3370, lng: -74.2580 },
  'willowemoc creek': { lat: 41.9400, lng: -74.7210 },

  // Finger Lakes
  'canadice lake': { lat: 42.7130, lng: -77.5730 },
  'canandaigua lake': { lat: 42.7860, lng: -77.2640 },
  'cayuga lake': { lat: 42.7180, lng: -76.7210 },
  'conesus lake': { lat: 42.7630, lng: -77.7120 },
  'hemlock lake': { lat: 42.7420, lng: -77.5990 },
  'honeoye lake': { lat: 42.7690, lng: -77.5100 },
  'keuka lake': { lat: 42.5590, lng: -77.1080 },
  'otisco lake': { lat: 42.8970, lng: -76.2790 },
  'owasco lake': { lat: 42.8350, lng: -76.4530 },
  'seneca lake': { lat: 42.6620, lng: -76.9090 },
  'skaneateles lake': { lat: 42.8820, lng: -76.3630 },

  // Long Island / NYC Metro
  'belmont lake': { lat: 40.7240, lng: -73.3390 },
  'connetquot river': { lat: 40.7470, lng: -73.1580 },
  'massapequa reservoir': { lat: 40.6740, lng: -73.4680 },
  'prospect park lake': { lat: 40.6610, lng: -73.9690 },
  'central park lake': { lat: 40.7760, lng: -73.9700 },

  // Capital District
  'basic creek': { lat: 42.5040, lng: -74.0240 },
  'six mile waterworks': { lat: 42.6560, lng: -73.7480 },
  'kinderhook creek': { lat: 42.4280, lng: -73.6770 },
  'hoosic river': { lat: 42.7360, lng: -73.2120 },
  'hudson river': { lat: 42.6530, lng: -73.7560 },
  'mohawk river': { lat: 42.8150, lng: -73.9420 },

  // Western NY
  'allegheny reservoir': { lat: 42.0080, lng: -78.8260 },
  'cattaraugus creek': { lat: 42.5770, lng: -79.0330 },
  'chautauqua lake': { lat: 42.1530, lng: -79.3950 },
  'eighteen mile creek': { lat: 42.6060, lng: -79.0220 },
  'oak orchard creek': { lat: 43.2650, lng: -78.2470 },
  'wiscoy creek': { lat: 42.5200, lng: -78.0650 },

  // Central NY
  'oneida lake': { lat: 43.2200, lng: -75.9130 },
  'onondaga lake': { lat: 43.0900, lng: -76.2100 },
  'salmon river': { lat: 43.5600, lng: -75.9130 },
  'chittenango creek': { lat: 43.0340, lng: -75.9130 },
  'oriskany creek': { lat: 43.1270, lng: -75.3320 },
  'sauquoit creek': { lat: 43.0110, lng: -75.2810 },
};

export default NY_WATERS;
