// Curated fishing regulations for top US fishing states
// NOTE: This data is for informational purposes only. Always verify with official sources.
// Last updated: 2025 — regulations change annually.

const stateRegulations = {
  TX: {
    state: 'Texas',
    agency: 'Texas Parks and Wildlife Department',
    url: 'https://tpwd.texas.gov/regulations/outdoor-annual/fishing',
    licenseRequired: true,
    licenseUrl: 'https://tpwd.texas.gov/business/licenses/recreational/',
    species: [
      { name: 'Largemouth Bass', minLength: 14, dailyLimit: 5, season: 'Year-round', status: 'open' },
      { name: 'Smallmouth Bass', minLength: 14, dailyLimit: 5, season: 'Year-round', status: 'open' },
      { name: 'Striped Bass', minLength: 18, dailyLimit: 5, season: 'Year-round', status: 'open' },
      { name: 'Channel Catfish', minLength: 12, dailyLimit: 25, season: 'Year-round', status: 'open' },
      { name: 'Blue Catfish', minLength: 12, dailyLimit: 25, season: 'Year-round', status: 'open' },
      { name: 'Crappie', minLength: 10, dailyLimit: 25, season: 'Year-round', status: 'open' },
      { name: 'Rainbow Trout', minLength: 12, dailyLimit: 5, season: 'Nov-Mar (stocked)', status: 'restricted' },
      { name: 'Red Drum', minLength: 20, maxLength: 28, dailyLimit: 3, season: 'Year-round', status: 'open' },
    ],
  },
  FL: {
    state: 'Florida',
    agency: 'Florida Fish and Wildlife Conservation Commission',
    url: 'https://myfwc.com/fishing/freshwater/regulations/',
    licenseRequired: true,
    licenseUrl: 'https://myfwc.com/license/',
    species: [
      { name: 'Largemouth Bass', minLength: 12, dailyLimit: 5, season: 'Year-round', status: 'open' },
      { name: 'Peacock Bass', minLength: 17, dailyLimit: 2, season: 'Year-round', status: 'restricted' },
      { name: 'Black Crappie', minLength: null, dailyLimit: 25, season: 'Year-round', status: 'open' },
      { name: 'Channel Catfish', minLength: null, dailyLimit: null, season: 'Year-round', status: 'open' },
      { name: 'Redfish', minLength: 18, maxLength: 27, dailyLimit: 1, season: 'Year-round', status: 'restricted' },
      { name: 'Snook', minLength: 28, maxLength: 33, dailyLimit: 1, season: 'Sep-Nov, Feb-Apr', status: 'restricted' },
      { name: 'Tarpon', minLength: null, dailyLimit: 1, season: 'Year-round (tag required)', status: 'restricted' },
    ],
  },
  CA: {
    state: 'California',
    agency: 'California Department of Fish and Wildlife',
    url: 'https://wildlife.ca.gov/Fishing/Inland/Trout-Inland-Fishing-Regulations',
    licenseRequired: true,
    licenseUrl: 'https://wildlife.ca.gov/Licensing/Fishing',
    species: [
      { name: 'Largemouth Bass', minLength: 12, dailyLimit: 5, season: 'Year-round', status: 'open' },
      { name: 'Smallmouth Bass', minLength: 12, dailyLimit: 5, season: 'Year-round', status: 'open' },
      { name: 'Rainbow Trout', minLength: null, dailyLimit: 5, season: 'Apr-Nov (varies)', status: 'restricted' },
      { name: 'Brown Trout', minLength: null, dailyLimit: 5, season: 'Apr-Nov (varies)', status: 'restricted' },
      { name: 'Striped Bass', minLength: 18, dailyLimit: 2, season: 'Year-round', status: 'open' },
      { name: 'Channel Catfish', minLength: null, dailyLimit: null, season: 'Year-round', status: 'open' },
      { name: 'Sturgeon', minLength: 40, maxLength: 60, dailyLimit: 1, season: 'Jan-Mar (varies)', status: 'restricted' },
    ],
  },
  NY: {
    state: 'New York',
    agency: 'New York State Dept. of Environmental Conservation',
    url: 'https://www.dec.ny.gov/outdoor/fishing.html',
    licenseRequired: true,
    licenseUrl: 'https://www.dec.ny.gov/permits/6091.html',
    species: [
      { name: 'Largemouth Bass', minLength: 12, dailyLimit: 5, season: 'Jun 15-Nov 30', status: 'restricted' },
      { name: 'Smallmouth Bass', minLength: 12, dailyLimit: 5, season: 'Jun 15-Nov 30', status: 'restricted' },
      { name: 'Rainbow Trout', minLength: 9, dailyLimit: 5, season: 'Apr 1-Oct 15', status: 'restricted' },
      { name: 'Brown Trout', minLength: 9, dailyLimit: 5, season: 'Apr 1-Oct 15', status: 'restricted' },
      { name: 'Walleye', minLength: 15, dailyLimit: 5, season: 'May 1-Mar 15', status: 'restricted' },
      { name: 'Northern Pike', minLength: 24, dailyLimit: 5, season: 'May 1-Mar 15', status: 'open' },
    ],
  },
  MI: {
    state: 'Michigan',
    agency: 'Michigan Department of Natural Resources',
    url: 'https://www.michigan.gov/dnr/things-to-do/fishing/regulations',
    licenseRequired: true,
    licenseUrl: 'https://www.michigan.gov/dnr/buy-and-apply/hunting-fishing-licenses',
    species: [
      { name: 'Largemouth Bass', minLength: 14, dailyLimit: 5, season: 'May 25-Dec 31 (varies)', status: 'restricted' },
      { name: 'Smallmouth Bass', minLength: 14, dailyLimit: 5, season: 'May 25-Dec 31 (varies)', status: 'restricted' },
      { name: 'Walleye', minLength: 15, dailyLimit: 5, season: 'Apr 26-Mar 15', status: 'restricted' },
      { name: 'Northern Pike', minLength: 24, dailyLimit: 5, season: 'May 15-Dec 31', status: 'restricted' },
      { name: 'Rainbow Trout', minLength: 8, dailyLimit: 5, season: 'Apr 26-Sep 30', status: 'restricted' },
      { name: 'Brown Trout', minLength: 8, dailyLimit: 5, season: 'Apr 26-Sep 30', status: 'restricted' },
      { name: 'Steelhead', minLength: null, dailyLimit: 3, season: 'Year-round', status: 'open' },
    ],
  },
  MN: {
    state: 'Minnesota',
    agency: 'Minnesota Department of Natural Resources',
    url: 'https://www.dnr.state.mn.us/fishing/regs.html',
    licenseRequired: true,
    licenseUrl: 'https://www.dnr.state.mn.us/licenses/fishing/index.html',
    species: [
      { name: 'Walleye', minLength: 15, dailyLimit: 6, season: 'May-Feb (varies)', status: 'restricted' },
      { name: 'Northern Pike', minLength: 24, dailyLimit: 3, season: 'May 11-Feb 23', status: 'restricted' },
      { name: 'Largemouth Bass', minLength: 12, dailyLimit: 6, season: 'May 24-Feb 23', status: 'restricted' },
      { name: 'Smallmouth Bass', minLength: 12, dailyLimit: 6, season: 'May 24-Feb 23', status: 'restricted' },
      { name: 'Crappie', minLength: null, dailyLimit: 10, season: 'Year-round', status: 'open' },
      { name: 'Lake Trout', minLength: null, dailyLimit: 3, season: 'Jan-Oct (varies)', status: 'restricted' },
    ],
  },
  WI: {
    state: 'Wisconsin',
    agency: 'Wisconsin Department of Natural Resources',
    url: 'https://dnr.wisconsin.gov/topic/fishing/regulations',
    licenseRequired: true,
    licenseUrl: 'https://dnr.wisconsin.gov/permits/fishing',
    species: [
      { name: 'Walleye', minLength: 15, dailyLimit: 5, season: 'May 3-Mar 1', status: 'restricted' },
      { name: 'Largemouth Bass', minLength: 14, dailyLimit: 5, season: 'May 3-Mar 1', status: 'restricted' },
      { name: 'Smallmouth Bass', minLength: 14, dailyLimit: 5, season: 'May 3-Mar 1', status: 'restricted' },
      { name: 'Northern Pike', minLength: 26, dailyLimit: 5, season: 'May 3-Mar 1', status: 'restricted' },
      { name: 'Musky', minLength: 36, dailyLimit: 1, season: 'May 31-Dec 31', status: 'restricted' },
      { name: 'Panfish (Bluegill/Crappie)', minLength: null, dailyLimit: 25, season: 'Year-round', status: 'open' },
    ],
  },
  CO: {
    state: 'Colorado',
    agency: 'Colorado Parks and Wildlife',
    url: 'https://cpw.state.co.us/thingstodo/Pages/Fishing.aspx',
    licenseRequired: true,
    licenseUrl: 'https://cpw.state.co.us/buyapply/Pages/Fishing.aspx',
    species: [
      { name: 'Rainbow Trout', minLength: null, dailyLimit: 4, season: 'Year-round (varies)', status: 'open' },
      { name: 'Brown Trout', minLength: null, dailyLimit: 4, season: 'Year-round (varies)', status: 'open' },
      { name: 'Brook Trout', minLength: null, dailyLimit: 8, season: 'Year-round', status: 'open' },
      { name: 'Largemouth Bass', minLength: 12, dailyLimit: 5, season: 'Year-round', status: 'open' },
      { name: 'Walleye', minLength: 15, dailyLimit: 5, season: 'Year-round', status: 'open' },
      { name: 'Kokanee Salmon', minLength: null, dailyLimit: 10, season: 'Year-round (varies)', status: 'open' },
    ],
  },
  NC: {
    state: 'North Carolina',
    agency: 'NC Wildlife Resources Commission',
    url: 'https://www.ncwildlife.org/Fishing/Regulations',
    licenseRequired: true,
    licenseUrl: 'https://www.ncwildlife.org/Licensing',
    species: [
      { name: 'Largemouth Bass', minLength: 14, dailyLimit: 5, season: 'Year-round', status: 'open' },
      { name: 'Smallmouth Bass', minLength: 12, dailyLimit: 5, season: 'Year-round', status: 'open' },
      { name: 'Striped Bass', minLength: 20, dailyLimit: 4, season: 'Year-round (varies)', status: 'restricted' },
      { name: 'Rainbow Trout', minLength: 7, dailyLimit: 7, season: 'Apr-Feb (varies)', status: 'restricted' },
      { name: 'Channel Catfish', minLength: null, dailyLimit: null, season: 'Year-round', status: 'open' },
      { name: 'Crappie', minLength: null, dailyLimit: 20, season: 'Year-round', status: 'open' },
    ],
  },
  MT: {
    state: 'Montana',
    agency: 'Montana Fish, Wildlife & Parks',
    url: 'https://fwp.mt.gov/fish/regulations',
    licenseRequired: true,
    licenseUrl: 'https://fwp.mt.gov/buyapply/licenses',
    species: [
      { name: 'Rainbow Trout', minLength: null, dailyLimit: 5, season: 'May 17-Nov 30 (varies)', status: 'restricted' },
      { name: 'Brown Trout', minLength: null, dailyLimit: 5, season: 'May 17-Nov 30 (varies)', status: 'restricted' },
      { name: 'Brook Trout', minLength: null, dailyLimit: 20, season: 'Year-round', status: 'open' },
      { name: 'Cutthroat Trout', minLength: null, dailyLimit: 3, season: 'May 17-Nov 30', status: 'restricted' },
      { name: 'Largemouth Bass', minLength: null, dailyLimit: 5, season: 'Year-round', status: 'open' },
      { name: 'Walleye', minLength: null, dailyLimit: 10, season: 'Year-round', status: 'open' },
      { name: 'Northern Pike', minLength: null, dailyLimit: null, season: 'Year-round', status: 'open' },
    ],
  },
  AK: {
    state: 'Alaska',
    agency: 'Alaska Department of Fish and Game',
    url: 'https://www.adfg.alaska.gov/index.cfm?adfg=fishregulations.main',
    licenseRequired: true,
    licenseUrl: 'https://www.adfg.alaska.gov/index.cfm?adfg=license.main',
    species: [
      { name: 'King Salmon', minLength: null, dailyLimit: 1, season: 'May-Jul (varies)', status: 'restricted' },
      { name: 'Silver Salmon', minLength: null, dailyLimit: 3, season: 'Jul-Oct', status: 'restricted' },
      { name: 'Sockeye Salmon', minLength: null, dailyLimit: 3, season: 'Jun-Sep', status: 'restricted' },
      { name: 'Rainbow Trout', minLength: null, dailyLimit: 2, season: 'Jun-Oct (varies)', status: 'restricted' },
      { name: 'Arctic Grayling', minLength: null, dailyLimit: 5, season: 'Year-round (varies)', status: 'open' },
      { name: 'Halibut', minLength: null, dailyLimit: 2, season: 'Feb-Dec (varies)', status: 'restricted' },
    ],
  },
  LA: {
    state: 'Louisiana',
    agency: 'Louisiana Department of Wildlife and Fisheries',
    url: 'https://www.wlf.louisiana.gov/page/recreational-fishing-regulations',
    licenseRequired: true,
    licenseUrl: 'https://www.wlf.louisiana.gov/page/license-sales',
    species: [
      { name: 'Largemouth Bass', minLength: 14, dailyLimit: 10, season: 'Year-round', status: 'open' },
      { name: 'Crappie', minLength: null, dailyLimit: 50, season: 'Year-round', status: 'open' },
      { name: 'Channel Catfish', minLength: null, dailyLimit: 100, season: 'Year-round', status: 'open' },
      { name: 'Redfish', minLength: 16, maxLength: 27, dailyLimit: 5, season: 'Year-round', status: 'open' },
      { name: 'Speckled Trout', minLength: 12, dailyLimit: 25, season: 'Year-round', status: 'open' },
    ],
  },
};

export default stateRegulations;

export const STATE_CODES = Object.keys(stateRegulations);

export function getStateByCode(code) {
  return stateRegulations[code?.toUpperCase()] || null;
}

export function getAllStates() {
  return Object.entries(stateRegulations).map(([code, data]) => ({
    code,
    name: data.state,
  }));
}
