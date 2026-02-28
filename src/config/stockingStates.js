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
};

export function getStateConfig(code) {
  return STOCKING_STATES[code?.toLowerCase()] || null;
}

export function getAvailableStates() {
  return Object.values(STOCKING_STATES);
}
