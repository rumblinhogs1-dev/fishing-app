/**
 * Static coordinate lookup for New Mexico stocked waters.
 * Coordinates sourced from stockingreport.com JSON + manual additions for popular waters.
 */
const NM_WATERS = {
  // From stockingreport.com coords data
  'alto lake': { lat: 33.3934, lng: -105.6672 },
  'bear canyon reservoir': { lat: 32.8829, lng: -107.9937 },
  'berrendo creek': { lat: 33.4236, lng: -104.4711 },
  'black river': { lat: 32.1741, lng: -104.2692 },
  'bottomless lakes': { lat: 33.3413, lng: -104.3349 },
  'carlsbad municipal lake': { lat: 32.4309, lng: -104.2151 },
  'escondida lake': { lat: 34.1219, lng: -106.8911 },
  'estancia park lake': { lat: 34.7556, lng: -106.0603 },
  'lake roberts': { lat: 33.0309, lng: -108.1615 },
  'lake van': { lat: 33.1934, lng: -104.3572 },
  'perch lake': { lat: 34.9259, lng: -104.6638 },
  'ruidoso river': { lat: 33.3346, lng: -105.6815 },
  'albuquerque drain': { lat: 35.0757, lng: -106.6625 },
  'albuquerque drain (south)': { lat: 35.0147, lng: -106.6702 },
  'animas river': { lat: 37.3044, lng: -107.8564 },
  'bernalillo drain': { lat: 35.2628, lng: -106.5928 },
  'bill evans lake': { lat: 32.8664, lng: -108.5739 },
  'bosque redondo': { lat: 34.4024, lng: -104.1961 },
  'eunice lake': { lat: 32.4653, lng: -103.2271 },
  'fenton lake': { lat: 35.8834, lng: -106.7264 },
  'green meadow lake': { lat: 32.7494, lng: -103.1664 },
  'jal lake': { lat: 32.0999, lng: -103.1883 },
  'lake maloya': { lat: 36.9896, lng: -104.3711 },
  'navajo reservoir': { lat: 36.8013, lng: -107.6068 },
  'peralta drain': { lat: 34.7753, lng: -106.7276 },
  'lake farmington': { lat: 36.8004, lng: -108.1032 },
  'bluewater lake': { lat: 35.3005, lng: -108.1273 },
  'san juan river': { lat: 36.8156, lng: -107.6592 },
  'san juan river (quality)': { lat: 36.8156, lng: -107.6592 },
  'san juan river (blw quality)': { lat: 36.7750, lng: -107.7100 },
  'jemez river': { lat: 35.7179, lng: -106.7219 },
  'heron reservoir': { lat: 36.6949, lng: -106.6947 },
  'jackson lake': { lat: 36.8097, lng: -108.2264 },
  'clayton lake': { lat: 36.5780, lng: -103.2999 },
  'monastery lake': { lat: 35.5982, lng: -105.6820 },
  'santa cruz reservoir': { lat: 35.9786, lng: -105.9198 },
  'rio las vacas': { lat: 36.0472, lng: -106.8192 },
  'snow lake': { lat: 33.4235, lng: -108.4955 },
  'conchas lake': { lat: 35.3939, lng: -104.1948 },
  'costilla river': { lat: 36.8932, lng: -105.4255 },
  'rio pueblo': { lat: 36.1853, lng: -105.6386 },
  'guadalupe river': { lat: 34.9330, lng: -104.6920 },
  'mcgaffey lake': { lat: 35.3777, lng: -108.5133 },
  'ute lake': { lat: 35.3404, lng: -103.4441 },
  'cow creek': { lat: 36.6414, lng: -106.1085 },
  'eagle nest lake': { lat: 36.5202, lng: -105.2589 },
  'quemado lake': { lat: 34.1353, lng: -108.4921 },
  'holy ghost creek': { lat: 35.7655, lng: -105.6974 },
  'los pinos river': { lat: 37.1118, lng: -107.6284 },
  'pecos river': { lat: 32.4199, lng: -104.2276 },
  'caballo lake': { lat: 32.9337, lng: -107.2968 },
  'canjilon lakes': { lat: 36.5560, lng: -106.3320 },
  'hopewell lake': { lat: 36.7063, lng: -106.2343 },
  'red river east fork': { lat: 36.5998, lng: -105.3850 },
  'brazos river': { lat: 35.6369, lng: -106.0612 },
  'san gregorio lake': { lat: 36.0278, lng: -106.8468 },
  'black canyon': { lat: 33.9767, lng: -106.8941 },
  'brantley dam': { lat: 32.5490, lng: -104.3780 },
  'shuree ponds': { lat: 36.7737, lng: -105.1931 },
  'goose lake': { lat: 36.6358, lng: -105.4498 },
  'elephant butte lake': { lat: 33.2325, lng: -107.1629 },
  'santa rosa lake': { lat: 35.0532, lng: -104.6677 },
  'bonito lake': { lat: 33.4570, lng: -105.7333 },
  'costilla creek': { lat: 36.8932, lng: -105.4255 },
  'el vado lake': { lat: 36.6000, lng: -106.7423 },
  'horseshoe lake': { lat: 32.1724, lng: -104.1065 },
  'lost lake': { lat: 35.8526, lng: -105.5152 },
  'middle fork lake': { lat: 36.5953, lng: -105.4173 },
  'lake katherine': { lat: 35.8342, lng: -105.7519 },
  'springer lake': { lat: 36.4167, lng: -104.6536 },
  'lake sumner': { lat: 34.6112, lng: -104.3657 },
  'placer creek': { lat: 36.7060, lng: -106.2347 },
  'rito de los pinos': { lat: 36.0647, lng: -106.9596 },
  'leandro creek': { lat: 36.9252, lng: -105.0776 },

  // Manual additions for frequently-stocked waters without coords
  'blue hole park pond': { lat: 34.9412, lng: -104.6830 },
  'conservancy park lake': { lat: 35.0726, lng: -106.6710 },
  'tingley beach': { lat: 35.0726, lng: -106.6710 },
  'red river': { lat: 36.7064, lng: -105.4045 },
  'glenwood pond': { lat: 33.3257, lng: -108.8867 },
  'timberon ponds': { lat: 32.6328, lng: -105.6878 },
  'grindstone reservoir': { lat: 33.3280, lng: -105.6780 },
  'liam knight pond': { lat: 35.0440, lng: -106.6710 },
  'belen riverside drain': { lat: 34.6629, lng: -106.7760 },
  'trees lake': { lat: 33.3970, lng: -105.6640 },
  'young pond': { lat: 33.3860, lng: -105.5640 },
  'oasis park lake': { lat: 35.0900, lng: -106.6240 },
  'rio grande': { lat: 36.3850, lng: -105.6820 },
  'chama river': { lat: 36.2070, lng: -106.5960 },
  'chaparral park lake': { lat: 35.1370, lng: -106.5870 },
  'dennis chaves pond': { lat: 35.0550, lng: -106.6730 },
  'greene acres lake': { lat: 35.0850, lng: -106.5280 },
  'cebolla river': { lat: 36.0730, lng: -106.7920 },
  'eagle rock lake': { lat: 36.4050, lng: -105.6870 },
  'ned houk ponds': { lat: 34.4170, lng: -103.2010 },
  'carrizozo recreation lake': { lat: 33.6380, lng: -105.8770 },
  'corona pond': { lat: 34.2440, lng: -105.6070 },
  'grants municipal pond': { lat: 35.1480, lng: -107.8530 },
  'river walk pond': { lat: 35.1480, lng: -107.8530 },
  'rancho grande pond': { lat: 35.1050, lng: -106.6740 },
  'aztec pond #1': { lat: 36.8240, lng: -108.0010 },
  'tiger park pond': { lat: 36.8210, lng: -107.9930 },
  'el rito creek': { lat: 34.9290, lng: -104.6840 },
  'corrales riverside drain': { lat: 35.2370, lng: -106.6070 },
  'harry mcadams park pond': { lat: 32.4510, lng: -104.2340 },
  'manzano lake': { lat: 34.6390, lng: -106.2600 },
  'bataan lake': { lat: 34.9930, lng: -104.6800 },
  'rio bonito lower': { lat: 33.4380, lng: -105.4880 },
  'rio bonito upper': { lat: 33.4690, lng: -105.6240 },
  'storrie reservoir': { lat: 35.6530, lng: -105.2260 },
  'lake alice': { lat: 36.9630, lng: -104.3820 },
  'morphy reservoir': { lat: 35.6870, lng: -105.4600 },
  'charette lake lower': { lat: 35.5180, lng: -105.1140 },
  'abiquiu reservoir': { lat: 36.2360, lng: -106.4190 },
  'pecos river (pecos canyon)': { lat: 35.7330, lng: -105.6850 },
  'pecos river (cowles to village of pecos)': { lat: 35.7100, lng: -105.6700 },
  'pecos river (villanueva to i-40)': { lat: 35.2500, lng: -105.3600 },
  'pecos river (vill of pecos - villanueva)': { lat: 35.4200, lng: -105.5100 },
  'pecos river (i-40 to lake sumner)': { lat: 34.9000, lng: -104.8500 },
  'pecos river (lake sumner to roswell)': { lat: 34.0600, lng: -104.4200 },
  'pecos river (south san isidro to villanueva state park)': { lat: 35.2700, lng: -105.3500 },
  'rio grande (pilar to cochiti lake)': { lat: 35.9900, lng: -106.0700 },
  'rio grande (gorge- abv pilar)': { lat: 36.3850, lng: -105.6820 },
  'rio grande (elephant butte to caballo)': { lat: 33.1000, lng: -107.2500 },
  'chama river (below abiquiu)': { lat: 36.2070, lng: -106.5960 },
  'chama river (blw el vado)': { lat: 36.6300, lng: -106.7200 },
  'chama river (abv el vado)': { lat: 36.8200, lng: -106.7400 },
  'red river (below questa)': { lat: 36.6800, lng: -105.5230 },
  'red river (abv questa)': { lat: 36.7064, lng: -105.4045 },
  'rock lake hatchery kids ponds': { lat: 33.3200, lng: -104.5100 },
  'conoco pond': { lat: 36.8240, lng: -108.0010 },
  'sipapu pond': { lat: 36.1840, lng: -105.5610 },
  'taos creek': { lat: 36.4030, lng: -105.5730 },
  'rio fernando de taos': { lat: 36.4030, lng: -105.5730 },
  'stubblefield lake': { lat: 36.4400, lng: -104.6400 },
  'cimarron river': { lat: 36.5100, lng: -105.0100 },
  'cimarron river gravel pit lakes': { lat: 36.5100, lng: -105.0100 },
  'laguna del campo': { lat: 36.3900, lng: -105.5000 },
  'burns lake': { lat: 36.3900, lng: -105.5000 },
  'coyote creek': { lat: 36.0800, lng: -105.2300 },
  'coyote creek pond': { lat: 36.0800, lng: -105.2300 },
  'gallinas river': { lat: 35.6200, lng: -105.2200 },
  'gallinas ice pond': { lat: 35.6200, lng: -105.2200 },
  'jemez river east fork': { lat: 35.8300, lng: -106.6100 },
  'mora': { lat: 35.9700, lng: -105.3800 },
  'san antonio river': { lat: 36.1200, lng: -105.6100 },
  'mt view ponds': { lat: 35.7300, lng: -105.6500 },
  'cowles ponds': { lat: 35.7300, lng: -105.6500 },
  'maxwell lake 13': { lat: 36.5300, lng: -104.5800 },
  'seven springs brood pond': { lat: 35.9800, lng: -106.7500 },
  'harris lake': { lat: 33.4200, lng: -108.5200 },
  'gila river': { lat: 33.2100, lng: -108.2000 },
  'gilita creek': { lat: 33.3400, lng: -108.5600 },
  'willow creek': { lat: 33.2600, lng: -108.2300 },
  'joe vigil lake': { lat: 36.9630, lng: -104.3820 },
  'hidden lake': { lat: 35.8500, lng: -105.5200 },
  'lake hazel': { lat: 35.8500, lng: -105.5200 },
  'upper trampas': { lat: 36.0100, lng: -105.6400 },
  'lower trampas': { lat: 36.0000, lng: -105.6300 },
  'nutrias lakes': { lat: 36.5700, lng: -106.3200 },
  'trout lakes': { lat: 36.5700, lng: -106.3200 },
  'casias lakes': { lat: 36.8000, lng: -105.1200 },
  'brazos lodge pond': { lat: 36.7300, lng: -106.5400 },
  'comanche creek': { lat: 36.9200, lng: -105.5400 },
  'el rito creek (trib of chama)': { lat: 36.5400, lng: -106.1700 },
  'red river west fork': { lat: 36.6300, lng: -105.4300 },
  'red river city ponds': { lat: 36.7064, lng: -105.4045 },
  'roswell kids pond': { lat: 33.3800, lng: -104.5200 },
  'sapillo creek': { lat: 33.0400, lng: -108.1300 },
  'clear creek': { lat: 35.8300, lng: -106.6500 },
  'ralph edwards derby': { lat: 33.1500, lng: -107.2300 },
  'white water creek': { lat: 33.2700, lng: -108.8300 },
  'bonito creek north fork': { lat: 33.4800, lng: -105.7500 },
  'bonito creek south fork': { lat: 33.4600, lng: -105.7600 },
  'peralta creek': { lat: 34.7700, lng: -106.7200 },
  'tajique creek': { lat: 34.7300, lng: -106.2700 },
};

/**
 * Look up coordinates for a water body name.
 * Uses fuzzy matching: tries exact, then substring, then word overlap.
 */
export function getWaterCoordinates(name) {
  if (!name) return null;
  const lower = name.toLowerCase().trim()
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Exact match
  if (NM_WATERS[lower]) return NM_WATERS[lower];

  // Substring match (input contains a known water name)
  for (const [key, coords] of Object.entries(NM_WATERS)) {
    if (lower.includes(key) || key.includes(lower)) return coords;
  }

  // Word overlap — require at least 2 matching words
  const words = lower.split(/\s+/).filter((w) => w.length > 2);
  let bestMatch = null;
  let bestScore = 0;
  for (const [key, coords] of Object.entries(NM_WATERS)) {
    const keyWords = key.split(/\s+/);
    const overlap = words.filter((w) => keyWords.some((kw) => kw.includes(w) || w.includes(kw))).length;
    if (overlap > bestScore && overlap >= 2) {
      bestScore = overlap;
      bestMatch = coords;
    }
  }

  return bestMatch;
}

export default NM_WATERS;
