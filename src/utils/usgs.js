import { haversine } from './weather';

/**
 * Fetch USGS gauge stations within a map viewport bounding box.
 * Returns an array of station objects with latest readings.
 * Parameter codes: 00010 = water temp, 00060 = flow rate, 00065 = gauge height
 */
export async function fetchUSGSStations(bounds) {
  const { north, south, east, west } = bounds;
  const bbox = `${west.toFixed(4)},${south.toFixed(4)},${east.toFixed(4)},${north.toFixed(4)}`;
  const url = `https://waterservices.usgs.gov/nwis/iv/?format=json&bBox=${bbox}&parameterCd=00010,00060,00065&siteStatus=active`;

  const res = await fetch(url);
  if (!res.ok) return [];

  const data = await res.json();
  const timeSeries = data.value?.timeSeries;
  if (!timeSeries || timeSeries.length === 0) return [];

  // Group time series by site ID
  const siteMap = {};

  for (const ts of timeSeries) {
    const site = ts.sourceInfo;
    const siteId = site?.siteCode?.[0]?.value;
    if (!siteId) continue;

    const sLat = site?.geoLocation?.geogLocation?.latitude;
    const sLng = site?.geoLocation?.geogLocation?.longitude;
    if (!sLat || !sLng) continue;

    if (!siteMap[siteId]) {
      siteMap[siteId] = {
        siteId,
        siteName: site.siteName || 'USGS Station',
        lat: sLat,
        lng: sLng,
        waterTemp: null,
        flowRate: null,
        gaugeHeight: null,
      };
    }

    const val = ts.values?.[0]?.value?.[0]?.value;
    if (!val || val === '-999999') continue;

    const paramCode = ts.variable?.variableCode?.[0]?.value;

    if (paramCode === '00010') {
      const tempC = parseFloat(val);
      if (!isNaN(tempC)) siteMap[siteId].waterTemp = Math.round(tempC * 9 / 5 + 32);
    }

    if (paramCode === '00060') {
      const flow = parseFloat(val);
      if (!isNaN(flow)) siteMap[siteId].flowRate = Math.round(flow);
    }

    if (paramCode === '00065') {
      const gh = parseFloat(val);
      if (!isNaN(gh)) siteMap[siteId].gaugeHeight = Math.round(gh * 100) / 100;
    }
  }

  return Object.values(siteMap);
}
