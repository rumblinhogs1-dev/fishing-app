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
    format: 'grid',
    sheets: [
      {
        name: 'Community Fishing',
        id: '1xJYPRrX2Gb7ACr6HxPB7mlsCw9K8NvClLfBIw7qjTcA',
        gid: '1486391694',
        type: 'community',
      },
      {
        name: 'Winter Stocking',
        id: '1PZuTV-zi5vMdxaMSnGx6c-QxeQQm-6DRQJJPKAZDjZM',
        gid: '1253509900',
        type: 'winter',
      },
      {
        name: 'Spring/Summer',
        id: '1S5wsDfGzEInV64UKjUPzexAe2KOO1KocfB4dJH7oVrs',
        gid: '0',
        type: 'springsummer',
      },
    ],
    cacheKey: 'az-stocking-v1',
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
    format: 'list',
    sheets: [
      {
        name: '2025 Stocking',
        id: '2PACX-1vSRURGSiGWRaPnJoz11cq0pTTaFPzIWGumsJONymkYmAmrGxYslI1f86qn2iad1R7iQzOhSlBV8rwWK',
        gid: '757471397',
        type: 'flat',
        published: true,
      },
    ],
    cacheKey: 'co-stocking-v1',
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
