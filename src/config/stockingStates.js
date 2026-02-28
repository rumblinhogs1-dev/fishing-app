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
      'Data sourced from publicly available AZGFD stocking schedules. MyCatchBook is not affiliated with Arizona Game & Fish Department.',
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
      'Data sourced from publicly available CPW stocking reports. MyCatchBook is not affiliated with Colorado Parks & Wildlife.',
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
      'Data sourced from publicly available NMDGF stocking reports via stockingreport.com. MyCatchBook is not affiliated with NM Department of Game & Fish.',
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
      'Data sourced from Utah Division of Wildlife Resources stocking database. MyCatchBook is not affiliated with Utah DWR.',
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
};

export function getStateConfig(code) {
  return STOCKING_STATES[code?.toLowerCase()] || null;
}

export function getAvailableStates() {
  return Object.values(STOCKING_STATES);
}
