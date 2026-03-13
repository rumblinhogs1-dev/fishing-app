export const STOCKING_STATES = {
  az: {
    code: 'az',
    name: 'Arizona',
    agency: 'AZGFD',
    agencyUrl: 'https://www.azgfd.com/fishing/stocking/',
    subtitle:
      'AZGFD stocking schedules for community fishing waters, winter, and spring/summer programs.',
    disclaimer:
      'Stocking schedules are tentative and subject to change due to weather, fish availability, and water conditions. Always verify with AZGFD before planning a trip.',
    bottomDisclaimer:
      'Data sourced from publicly available AZGFD stocking schedules. CatchDaddy is not affiliated with Arizona Game & Fish Department.',
    format: 'proxy-grid',
    sheets: [
      {
        name: 'Community Fishing',
        type: 'community',
      },
      {
        name: 'Winter Stocking',
        type: 'winter',
      },
      {
        name: 'Spring/Summer',
        type: 'springsummer',
      },
    ],
    proxyUrl: '/api/arizona-stocking',
    cacheKey: 'az-stocking-v2',
    getCoordinates: () => import('../data/azWaterCoordinates.js'),
  },
  co: {
    code: 'co',
    name: 'Colorado',
    agency: 'CPW',
    agencyUrl: 'https://cpw.state.co.us/fishing/stocking-report',
    subtitle:
      'CPW weekly fish stocking reports for Colorado lakes, reservoirs, and rivers.',
    disclaimer:
      'Stocking reports reflect weekly summaries and may not include exact dates. Always verify with CPW before planning a trip.',
    bottomDisclaimer:
      'Data sourced from publicly available CPW stocking reports. CatchDaddy is not affiliated with Colorado Parks & Wildlife.',
    format: 'proxy-json',
    sheets: [
      {
        name: 'CO Stocking',
        url: '/api/colorado-stocking',
      },
    ],
    cacheKey: 'co-stocking-v2',
    getCoordinates: () => import('../data/coWaterCoordinates.js'),
  },
  id: {
    code: 'id',
    name: 'Idaho',
    agency: 'IDFG',
    agencyUrl: 'https://idfg.idaho.gov/fish/stocking',
    subtitle:
      'IDFG fish stocking reports for Idaho lakes, reservoirs, rivers, and ponds.',
    disclaimer:
      'Stocking reports reflect IDFG records and may not include exact dates. Always verify with Idaho Fish and Game before planning a trip.',
    bottomDisclaimer:
      'Data sourced from Idaho Department of Fish and Game stocking database. CatchDaddy is not affiliated with IDFG.',
    format: 'proxy-json',
    sheets: [
      {
        name: 'Idaho Stocking Data',
        url: '/api/idaho-stocking',
      },
    ],
    cacheKey: 'id-stocking-v1',
    getCoordinates: () => import('../data/idWaterCoordinates.js'),
  },
  nm: {
    code: 'nm',
    name: 'New Mexico',
    agency: 'NMDGF',
    agencyUrl: 'https://wildlife.dgf.nm.gov/fishing/weekly-report/',
    subtitle:
      'NMDGF weekly fish stocking reports for New Mexico lakes, rivers, and ponds.',
    disclaimer:
      'Stocking data sourced from weekly NMDGF reports. Dates and quantities may vary. Always verify with NMDGF before planning a trip.',
    bottomDisclaimer:
      'Data sourced from publicly available NMDGF stocking reports via stockingreport.com. CatchDaddy is not affiliated with NM Department of Game & Fish.',
    format: 'json',
    sheets: [
      {
        name: 'NM Stocking Data',
        url: 'https://www.stockingreport.com/stocking_data.json',
      },
    ],
    cacheKey: 'nm-stocking-v1',
    getCoordinates: () => import('../data/nmWaterCoordinates.js'),
  },
  ut: {
    code: 'ut',
    name: 'Utah',
    agency: 'DWR',
    agencyUrl: 'https://dwrapps.utah.gov/fishstocking/Fish',
    subtitle:
      'Utah DWR fish stocking reports for Utah lakes, reservoirs, and streams.',
    disclaimer:
      'Stocking reports reflect DWR records and may not include exact dates. Always verify with Utah DWR before planning a trip.',
    bottomDisclaimer:
      'Data sourced from Utah Division of Wildlife Resources stocking database. CatchDaddy is not affiliated with Utah DWR.',
    format: 'proxy-json',
    sheets: [
      {
        name: 'Utah Stocking Data',
        url: '/api/utah-stocking?y=CURRENT_YEAR',
      },
    ],
    cacheKey: 'ut-stocking-v1',
    getCoordinates: () => import('../data/utWaterCoordinates.js'),
  },
  or: {
    code: 'or',
    name: 'Oregon',
    agency: 'ODFW',
    agencyUrl: 'https://myodfw.com/fishing/species/trout/stocking-schedule',
    subtitle:
      'ODFW weekly trout stocking schedule for Oregon lakes, reservoirs, rivers, and ponds.',
    disclaimer:
      'Stocking dates reflect the week a waterbody is expected to be stocked, not exact days. Always verify with ODFW before planning a trip.',
    bottomDisclaimer:
      'Data sourced from publicly available ODFW stocking schedules. CatchDaddy is not affiliated with Oregon Department of Fish & Wildlife.',
    format: 'proxy-json',
    sheets: [
      {
        name: 'Oregon Trout Stocking',
        url: '/api/oregon-stocking',
      },
    ],
    cacheKey: 'or-stocking-v1',
    getCoordinates: () => import('../data/orWaterCoordinates.js'),
  },
  wa: {
    code: 'wa',
    name: 'Washington',
    agency: 'WDFW',
    agencyUrl: 'https://wdfw.wa.gov/fishing/reports/stocking',
    subtitle:
      'WDFW trout and kokanee stocking reports for Washington lakes, rivers, and streams.',
    disclaimer:
      'Stocking data sourced from WDFW public records on data.wa.gov. Always verify with WDFW before planning a trip.',
    bottomDisclaimer:
      'Data sourced from publicly available WDFW fish plant records. CatchDaddy is not affiliated with Washington Department of Fish & Wildlife.',
    format: 'soda-json',
    sheets: [
      {
        name: 'WA Trout Stocking',
        url: 'https://data.wa.gov/resource/6fex-3r7d.json?$limit=2000&$where=release_year=%27CURRENT_YEAR%27%20AND%20species_type=%27Trout/Kokanee%27&$order=release_start_date%20DESC',
        fieldMap: {
          date: 'release_start_date',
          year: 'release_year',
          waterBody: 'release_location',
          species: 'species',
          region: 'county',
          quantity: 'number_released',
          size: 'lifestage',
        },
      },
    ],
    cacheKey: 'wa-stocking-v1',
    getCoordinates: () => import('../data/waWaterCoordinates.js'),
  },
  va: {
    code: 'va',
    name: 'Virginia',
    agency: 'DWR',
    agencyUrl: 'https://dwr.virginia.gov/fishing/trout-stocking-schedule/',
    subtitle:
      'Virginia DWR trout stocking schedule for streams, rivers, and lakes across Virginia.',
    disclaimer:
      'Stocking data sourced from Virginia DWR public schedule. Always verify with DWR before planning a trip.',
    bottomDisclaimer:
      'Data sourced from publicly available Virginia DWR stocking schedules. CatchDaddy is not affiliated with Virginia Department of Wildlife Resources.',
    format: 'proxy-json',
    sheets: [
      {
        name: 'VA Trout Stocking',
        url: '/api/virginia-stocking',
      },
    ],
    cacheKey: 'va-stocking-v1',
    getCoordinates: () => import('../data/vaWaterCoordinates.js'),
  },
  mt: {
    code: 'mt',
    name: 'Montana',
    agency: 'FWP',
    agencyUrl: 'https://myfwp.mt.gov/fishMT/plants/',
    subtitle:
      'Montana FWP fish stocking reports for lakes, reservoirs, rivers, and streams.',
    disclaimer:
      'Stocking data sourced from Montana FWP public database. Always verify with FWP before planning a trip.',
    bottomDisclaimer:
      'Data sourced from publicly available Montana FWP stocking records. CatchDaddy is not affiliated with Montana Fish, Wildlife & Parks.',
    format: 'proxy-json',
    sheets: [
      {
        name: 'MT Fish Stocking',
        url: '/api/montana-stocking',
      },
    ],
    cacheKey: 'mt-stocking-v1',
    getCoordinates: () => import('../data/mtWaterCoordinates.js'),
  },
  mi: {
    code: 'mi',
    name: 'Michigan',
    agency: 'DNR',
    agencyUrl: 'https://www2.dnr.state.mi.us/fishstock/',
    subtitle:
      'Michigan DNR fish stocking reports for lakes, rivers, and streams across Michigan.',
    disclaimer:
      'Stocking data sourced from Michigan DNR public database. Always verify with MI DNR before planning a trip.',
    bottomDisclaimer:
      'Data sourced from publicly available Michigan DNR stocking records. CatchDaddy is not affiliated with Michigan Department of Natural Resources.',
    format: 'proxy-json',
    sheets: [
      {
        name: 'MI Fish Stocking',
        url: '/api/michigan-stocking',
      },
    ],
    cacheKey: 'mi-stocking-v1',
    getCoordinates: () => import('../data/miWaterCoordinates.js'),
  },
  wi: {
    code: 'wi',
    name: 'Wisconsin',
    agency: 'DNR',
    agencyUrl: 'https://apps.dnr.wi.gov/fisheriesmanagement/Public/Summary/Index',
    subtitle:
      'Wisconsin DNR fish stocking reports for lakes, rivers, and streams across Wisconsin.',
    disclaimer:
      'Stocking data sourced from Wisconsin DNR public database. Always verify with WI DNR before planning a trip.',
    bottomDisclaimer:
      'Data sourced from publicly available Wisconsin DNR stocking records. CatchDaddy is not affiliated with Wisconsin Department of Natural Resources.',
    format: 'proxy-json',
    sheets: [
      {
        name: 'WI Fish Stocking',
        url: '/api/wisconsin-stocking',
      },
    ],
    cacheKey: 'wi-stocking-v1',
    getCoordinates: () => import('../data/wiWaterCoordinates.js'),
  },
  nc: {
    code: 'nc',
    name: 'North Carolina',
    agency: 'NCWRC',
    agencyUrl: 'https://ncpaws.org/PAWS/Fish/Stocking/Schedule/OnlineSchedule.aspx',
    subtitle:
      'NCWRC daily trout stocking schedule for North Carolina streams and rivers.',
    disclaimer:
      'Stocking data sourced from NCWRC public schedule. Updated daily after noon. Always verify with NCWRC before planning a trip.',
    bottomDisclaimer:
      'Data sourced from publicly available NCWRC stocking schedules. CatchDaddy is not affiliated with NC Wildlife Resources Commission.',
    format: 'proxy-json',
    sheets: [
      {
        name: 'NC Trout Stocking',
        url: '/api/nc-stocking',
      },
    ],
    cacheKey: 'nc-stocking-v1',
    getCoordinates: () => import('../data/ncWaterCoordinates.js'),
  },
  tn: {
    code: 'tn',
    name: 'Tennessee',
    agency: 'TWRA',
    agencyUrl: 'https://www.tn.gov/twra/fishing/trout-information-stockings.html',
    subtitle:
      'TWRA trout stocking schedule for Tennessee tailwaters, streams, and lakes.',
    disclaimer:
      'Stocking data sourced from TWRA public schedule. Always verify with TWRA before planning a trip.',
    bottomDisclaimer:
      'Data sourced from publicly available TWRA stocking schedules. CatchDaddy is not affiliated with Tennessee Wildlife Resources Agency.',
    format: 'proxy-json',
    sheets: [
      {
        name: 'TN Trout Stocking',
        url: '/api/tennessee-stocking',
      },
    ],
    cacheKey: 'tn-stocking-v1',
    getCoordinates: () => import('../data/tnWaterCoordinates.js'),
  },
  ca: {
    code: 'ca',
    name: 'California',
    agency: 'CDFW',
    agencyUrl: 'https://nrm.dfg.ca.gov/fishplants/',
    subtitle:
      'CDFW real-time fish planting reports for California lakes, rivers, and streams.',
    disclaimer:
      'Fish plant data updated in real-time by CDFW hatchery staff. Always verify with CDFW before planning a trip.',
    bottomDisclaimer:
      'Data sourced from publicly available CDFW fish planting records. CatchDaddy is not affiliated with California Department of Fish & Wildlife.',
    format: 'proxy-json',
    sheets: [
      {
        name: 'CA Fish Plants',
        url: '/api/california-stocking',
      },
    ],
    cacheKey: 'ca-stocking-v1',
    getCoordinates: () => import('../data/caWaterCoordinates.js'),
  },
  wv: {
    code: 'wv',
    name: 'West Virginia',
    agency: 'WVDNR',
    agencyUrl: 'https://wvdnr.gov/fishing/fish-stocking/',
    subtitle:
      'WVDNR daily trout stocking updates for West Virginia streams, rivers, and lakes.',
    disclaimer:
      'Stocking data sourced from WVDNR daily updates. Always verify with WVDNR before planning a trip.',
    bottomDisclaimer:
      'Data sourced from publicly available WVDNR stocking updates. CatchDaddy is not affiliated with West Virginia Division of Natural Resources.',
    format: 'proxy-json',
    sheets: [
      {
        name: 'WV Trout Stocking',
        url: '/api/wv-stocking',
      },
    ],
    cacheKey: 'wv-stocking-v1',
    getCoordinates: () => import('../data/wvWaterCoordinates.js'),
  },
  md: {
    code: 'md',
    name: 'Maryland',
    agency: 'DNR',
    agencyUrl: 'https://dnr.maryland.gov/fisheries/pages/trout/stocking-schedule.aspx',
    subtitle:
      'Maryland DNR trout stocking reports for streams, lakes, and ponds across Maryland.',
    disclaimer:
      'Stocking data sourced from Maryland DNR public API. Always verify with MD DNR before planning a trip.',
    bottomDisclaimer:
      'Data sourced from publicly available Maryland DNR stocking records. CatchDaddy is not affiliated with Maryland Department of Natural Resources.',
    format: 'proxy-json',
    sheets: [
      {
        name: 'MD Trout Stocking',
        url: '/api/maryland-stocking',
      },
    ],
    cacheKey: 'md-stocking-v1',
    getCoordinates: () => import('../data/mdWaterCoordinates.js'),
  },
  sc: {
    code: 'sc',
    name: 'South Carolina',
    agency: 'SCDNR',
    agencyUrl: 'https://www.dnr.sc.gov/fish/stocking/',
    subtitle:
      'South Carolina DNR weekly trout stocking results for rivers and lakes.',
    disclaimer:
      'Stocking data sourced from SCDNR weekly reports. Always verify with SCDNR before planning a trip.',
    bottomDisclaimer:
      'Data sourced from publicly available SC DNR stocking results. CatchDaddy is not affiliated with South Carolina Department of Natural Resources.',
    format: 'proxy-json',
    sheets: [
      {
        name: 'SC Trout Stocking',
        url: '/api/sc-stocking',
      },
    ],
    cacheKey: 'sc-stocking-v1',
    getCoordinates: () => import('../data/scWaterCoordinates.js'),
  },
  ia: {
    code: 'ia',
    name: 'Iowa',
    agency: 'DNR',
    agencyUrl: 'https://www.iowadnr.gov/things-do/fishing/where-fish/trout-fishing',
    subtitle:
      'Iowa DNR community trout stocking schedule for urban fishing ponds and lakes.',
    disclaimer:
      'Stocking data sourced from Iowa DNR community trout program. Always verify with IA DNR before planning a trip.',
    bottomDisclaimer:
      'Data sourced from publicly available Iowa DNR stocking schedules. CatchDaddy is not affiliated with Iowa Department of Natural Resources.',
    format: 'proxy-json',
    sheets: [
      {
        name: 'IA Community Trout',
        url: '/api/iowa-stocking',
      },
    ],
    cacheKey: 'ia-stocking-v1',
    getCoordinates: () => import('../data/iaWaterCoordinates.js'),
  },
  ny: {
    code: 'ny',
    name: 'New York',
    agency: 'DEC',
    agencyUrl: 'https://dec.ny.gov/things-to-do/freshwater-fishing/stocking',
    subtitle:
      'NY DEC spring trout stocking reports for New York lakes, ponds, rivers, and streams.',
    disclaimer:
      'Stocking data sourced from NY DEC public records on data.ny.gov. Dates reflect planned stocking weeks. Always verify with DEC before planning a trip.',
    bottomDisclaimer:
      'Data sourced from publicly available NY DEC stocking records. CatchDaddy is not affiliated with New York Department of Environmental Conservation.',
    format: 'soda-json',
    sheets: [
      {
        name: 'NY Spring Trout Stocking',
        url: 'https://data.ny.gov/resource/d9y2-n436.json?$limit=5000',
        fieldMap: {
          date: 'date',
          year: 'year',
          waterBody: 'waterbody',
          species: 'species_name',
          region: 'county',
          quantity: 'number',
          size: 'size_inches',
        },
      },
    ],
    cacheKey: 'ny-stocking-v1',
    getCoordinates: () => import('../data/nyWaterCoordinates.js'),
  },
};

export function getStateConfig(code) {
  return STOCKING_STATES[code?.toLowerCase()] || null;
}

export function getAvailableStates() {
  return Object.values(STOCKING_STATES);
}
