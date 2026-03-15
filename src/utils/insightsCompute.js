import { getMoonPhase } from './solunar';
import { getConservationStats } from './conservation';

function getSeason(month) {
  if (month >= 3 && month <= 5) return 'Spring';
  if (month >= 6 && month <= 8) return 'Summer';
  if (month >= 9 && month <= 11) return 'Fall';
  return 'Winter';
}

function getTimeSlot(hour) {
  if (hour >= 5 && hour < 8) return 'Dawn';
  if (hour >= 8 && hour < 11) return 'Morning';
  if (hour >= 11 && hour < 14) return 'Midday';
  if (hour >= 14 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 20) return 'Evening';
  return 'Night';
}

function tempBucket(temp) {
  const base = Math.floor(temp / 5) * 5;
  return `${base}-${base + 4}`;
}

function pressureBucket(p) {
  const base = Math.floor(p / 5) * 5;
  return `${base}-${base + 4}`;
}

function windBucket(w) {
  if (w < 5) return '0-4';
  if (w < 10) return '5-9';
  if (w < 15) return '10-14';
  if (w < 20) return '15-19';
  return '20+';
}

function cloudBucket(c) {
  if (c <= 20) return 'Clear';
  if (c <= 50) return 'Partly Cloudy';
  if (c <= 80) return 'Mostly Cloudy';
  return 'Overcast';
}

export function computeInsightsData(catches) {
  if (!catches || catches.length === 0) return null;

  // === Records ===
  const withWeight = catches.filter((c) => c.weight);
  const withLength = catches.filter((c) => c.length);
  const heaviest = withWeight.length ? withWeight.reduce((a, b) => (a.weight > b.weight ? a : b)) : null;
  const longest = withLength.length ? withLength.reduce((a, b) => (a.length > b.length ? a : b)) : null;

  const dateCounts = {};
  const dateCatches = {};
  catches.forEach((c) => {
    if (c.date) {
      const day = c.date.slice(0, 10);
      dateCounts[day] = (dateCounts[day] || 0) + 1;
      if (!dateCatches[day]) dateCatches[day] = [];
      dateCatches[day].push(c);
    }
  });
  const bestDay = Object.entries(dateCounts).sort((a, b) => b[1] - a[1])[0] || null;
  const bestDayCatches = bestDay ? dateCatches[bestDay[0]] : [];
  const mostRecent = catches.filter((c) => c.date).sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0] || null;

  // Species-specific PBs
  const speciesGroups = {};
  catches.forEach((c) => {
    if (c.species) {
      const s = c.species.trim().toLowerCase();
      if (!speciesGroups[s]) speciesGroups[s] = [];
      speciesGroups[s].push(c);
    }
  });

  const speciesPBs = {};
  Object.entries(speciesGroups).forEach(([species, group]) => {
    const wGroup = group.filter((c) => c.weight);
    const lGroup = group.filter((c) => c.length);
    speciesPBs[species] = {
      count: group.length,
      heaviest: wGroup.length ? wGroup.reduce((a, b) => (a.weight > b.weight ? a : b)) : null,
      longest: lGroup.length ? lGroup.reduce((a, b) => (a.length > b.length ? a : b)) : null,
    };
  });

  // Streaks
  const fishingDays = [...new Set(catches.filter((c) => c.date).map((c) => c.date.slice(0, 10)))].sort();
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;
  for (let i = 1; i < fishingDays.length; i++) {
    const prev = new Date(fishingDays[i - 1]);
    const curr = new Date(fishingDays[i]);
    const diff = (curr - prev) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      tempStreak++;
    } else {
      if (tempStreak > longestStreak) longestStreak = tempStreak;
      tempStreak = 1;
    }
  }
  if (tempStreak > longestStreak) longestStreak = tempStreak;
  // Current streak: count backwards from most recent day
  if (fishingDays.length) {
    const today = new Date().toISOString().slice(0, 10);
    const lastDay = fishingDays[fishingDays.length - 1];
    const daysDiff = (new Date(today) - new Date(lastDay)) / (1000 * 60 * 60 * 24);
    if (daysDiff <= 1) {
      currentStreak = 1;
      for (let i = fishingDays.length - 2; i >= 0; i--) {
        const prev = new Date(fishingDays[i]);
        const curr = new Date(fishingDays[i + 1]);
        if ((curr - prev) / (1000 * 60 * 60 * 24) === 1) {
          currentStreak++;
        } else break;
      }
    }
  }

  // PB timeline (running max weight over time)
  const pbTimeline = [];
  if (withWeight.length) {
    const sorted = [...withWeight].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    let maxW = 0;
    sorted.forEach((c) => {
      if (c.weight > maxW) {
        maxW = c.weight;
        pbTimeline.push({ date: c.date?.slice(0, 10) || '', weight: maxW, catch: c });
      }
    });
  }

  // === Species ===
  const speciesCount = {};
  catches.forEach((c) => {
    if (c.species) {
      const s = c.species.trim().toLowerCase();
      speciesCount[s] = (speciesCount[s] || 0) + 1;
    }
  });
  const topSpecies = Object.entries(speciesCount).sort((a, b) => b[1] - a[1]);

  // Species seasonal heatmap
  const speciesSeasonalHeatmap = {};
  catches.forEach((c) => {
    if (c.species && c.date) {
      const s = c.species.trim().toLowerCase();
      const m = parseInt(c.date.slice(5, 7)) - 1;
      if (!speciesSeasonalHeatmap[s]) speciesSeasonalHeatmap[s] = new Array(12).fill(0);
      speciesSeasonalHeatmap[s][m]++;
    }
  });

  // Species size progression (weight and length)
  const speciesSizeProgression = {};
  catches.forEach((c) => {
    if (c.species && c.date && (c.weight > 0 || c.length > 0)) {
      const s = c.species.trim().toLowerCase();
      if (!speciesSizeProgression[s]) speciesSizeProgression[s] = [];
      speciesSizeProgression[s].push({
        date: c.date.slice(0, 10),
        weight: c.weight > 0 ? c.weight : null,
        length: c.length > 0 ? c.length : null,
        id: c.id,
      });
    }
  });
  Object.values(speciesSizeProgression).forEach((arr) => arr.sort((a, b) => a.date.localeCompare(b.date)));

  // === Monthly trends ===
  const monthCount = {};
  catches.forEach((c) => {
    if (c.date) {
      const key = c.date.slice(0, 7);
      monthCount[key] = (monthCount[key] || 0) + 1;
    }
  });
  const months = Object.entries(monthCount).sort((a, b) => a[0].localeCompare(b[0]));

  // Year-over-year
  const yearMonth = {};
  catches.forEach((c) => {
    if (c.date) {
      const year = c.date.slice(0, 4);
      const month = c.date.slice(5, 7);
      if (!yearMonth[year]) yearMonth[year] = {};
      yearMonth[year][month] = (yearMonth[year][month] || 0) + 1;
    }
  });
  const years = Object.keys(yearMonth).sort();

  // === Conditions ===
  const weatherTemps = catches.filter((c) => c.weatherTemp).map((c) => Number(c.weatherTemp));
  const pressures = catches.filter((c) => c.weatherPressure).map((c) => Number(c.weatherPressure));
  const winds = catches.filter((c) => c.weatherWind).map((c) => Number(c.weatherWind));

  const avgTemp = weatherTemps.length ? Math.round(weatherTemps.reduce((s, t) => s + t, 0) / weatherTemps.length) : null;
  const avgPressure = pressures.length ? Math.round(pressures.reduce((s, p) => s + p, 0) / pressures.length) : null;
  const avgWind = winds.length ? Math.round(winds.reduce((s, w) => s + w, 0) / winds.length * 10) / 10 : null;

  const seasonCount = { Spring: 0, Summer: 0, Fall: 0, Winter: 0 };
  catches.forEach((c) => {
    if (c.date) {
      const m = parseInt(c.date.slice(5, 7));
      seasonCount[getSeason(m)]++;
    }
  });

  // Temperature buckets
  const tempBuckets = {};
  weatherTemps.forEach((t) => {
    const b = tempBucket(t);
    tempBuckets[b] = (tempBuckets[b] || 0) + 1;
  });
  const tempBucketData = Object.entries(tempBuckets)
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .map(([label, value]) => ({ label: `${label}°F`, value }));

  // Pressure buckets
  const pressureBuckets = {};
  pressures.forEach((p) => {
    const b = pressureBucket(p);
    pressureBuckets[b] = (pressureBuckets[b] || 0) + 1;
  });
  const pressureBucketData = Object.entries(pressureBuckets)
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .map(([label, value]) => ({ label: `${label} mb`, value }));

  // Wind buckets
  const windBucketData = {};
  winds.forEach((w) => {
    const b = windBucket(w);
    windBucketData[b] = (windBucketData[b] || 0) + 1;
  });
  const windBuckets2 = ['0-4', '5-9', '10-14', '15-19', '20+']
    .map((label) => ({ label: `${label} mph`, value: windBucketData[label] || 0 }))
    .filter((d) => d.value > 0);

  // Moon phase correlation
  const moonPhaseCounts = {};
  catches.forEach((c) => {
    if (c.date) {
      const { name } = getMoonPhase(c.date);
      moonPhaseCounts[name] = (moonPhaseCounts[name] || 0) + 1;
    }
  });
  const moonPhaseData = Object.entries(moonPhaseCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));

  // Cloud cover buckets
  const cloudBuckets = {};
  catches.forEach((c) => {
    if (c.weatherCloudCover !== undefined && c.weatherCloudCover !== '') {
      const b = cloudBucket(Number(c.weatherCloudCover));
      cloudBuckets[b] = (cloudBuckets[b] || 0) + 1;
    }
  });
  const cloudBucketData = ['Clear', 'Partly Cloudy', 'Mostly Cloudy', 'Overcast']
    .map((label) => ({ label, value: cloudBuckets[label] || 0 }))
    .filter((d) => d.value > 0);

  // Best ranges
  const bestTempRange = tempBucketData.length ? tempBucketData.reduce((a, b) => (a.value > b.value ? a : b)).label : null;
  const bestPressureRange = pressureBucketData.length ? pressureBucketData.reduce((a, b) => (a.value > b.value ? a : b)).label : null;
  const bestWindRange = windBuckets2.length ? windBuckets2.reduce((a, b) => (a.value > b.value ? a : b)).label : null;
  const bestMoonPhase = moonPhaseData.length ? moonPhaseData[0].label : null;

  // === Lures / baits ===
  const lureCount = {};
  const lureBySpecies = {};
  const lureBySeason = {};
  const lureByWaterTemp = {};
  catches.forEach((c) => {
    const lure = c.lureName || c.bait;
    if (lure) {
      const l = lure.trim();
      lureCount[l] = (lureCount[l] || 0) + 1;
      if (c.species) {
        if (!lureBySpecies[l]) lureBySpecies[l] = {};
        const s = c.species.trim().toLowerCase();
        lureBySpecies[l][s] = (lureBySpecies[l][s] || 0) + 1;
      }
      if (c.date) {
        const m = parseInt(c.date.slice(5, 7));
        const season = getSeason(m);
        if (!lureBySeason[l]) lureBySeason[l] = { Spring: 0, Summer: 0, Fall: 0, Winter: 0 };
        lureBySeason[l][season]++;
      }
      if (c.waterTemp) {
        const b = tempBucket(Number(c.waterTemp));
        if (!lureByWaterTemp[l]) lureByWaterTemp[l] = {};
        lureByWaterTemp[l][b] = (lureByWaterTemp[l][b] || 0) + 1;
      }
    }
  });
  const topLures = Object.entries(lureCount).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Lure best-for summary
  const lureBestFor = {};
  topLures.forEach(([lure]) => {
    const speciesData = lureBySpecies[lure];
    if (speciesData) {
      const top = Object.entries(speciesData).sort((a, b) => b[1] - a[1])[0];
      const seasonData = lureBySeason[lure];
      const topSeason = seasonData ? Object.entries(seasonData).sort((a, b) => b[1] - a[1])[0] : null;
      const tempData = lureByWaterTemp[lure];
      const topTemp = tempData ? Object.entries(tempData).sort((a, b) => b[1] - a[1])[0] : null;
      lureBestFor[lure] = {
        species: top ? top[0] : null,
        season: topSeason && topSeason[1] > 0 ? topSeason[0] : null,
        tempRange: topTemp ? `${topTemp[0]}°F` : null,
      };
    }
  });

  // === Locations ===
  const locationCount = {};
  const locationSpecies = {};
  const locationSpeciesCount = {};
  const locationBySeason = {};
  const locationByHour = {};
  const locationByMonth = {};
  catches.forEach((c) => {
    if (c.location) {
      const l = c.location.trim();
      locationCount[l] = (locationCount[l] || 0) + 1;
      if (c.species) {
        if (!locationSpecies[l]) locationSpecies[l] = new Set();
        locationSpecies[l].add(c.species.trim().toLowerCase());
        if (!locationSpeciesCount[l]) locationSpeciesCount[l] = {};
        const s = c.species.trim().toLowerCase();
        locationSpeciesCount[l][s] = (locationSpeciesCount[l][s] || 0) + 1;
      }
      if (c.date) {
        const m = parseInt(c.date.slice(5, 7));
        const season = getSeason(m);
        if (!locationBySeason[l]) locationBySeason[l] = { Spring: 0, Summer: 0, Fall: 0, Winter: 0 };
        locationBySeason[l][season]++;

        const monthKey = c.date.slice(0, 7);
        if (!locationByMonth[l]) locationByMonth[l] = {};
        locationByMonth[l][monthKey] = (locationByMonth[l][monthKey] || 0) + 1;

        if (c.date.length > 10) {
          const h = parseInt(c.date.slice(11, 13));
          if (!isNaN(h)) {
            const slot = getTimeSlot(h);
            if (!locationByHour[l]) locationByHour[l] = {};
            locationByHour[l][slot] = (locationByHour[l][slot] || 0) + 1;
          }
        }
      }
    }
  });
  const topLocations = Object.entries(locationCount).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Location best season/time
  const locationBestSeason = {};
  const locationBestTime = {};
  topLocations.forEach(([loc]) => {
    if (locationBySeason[loc]) {
      const best = Object.entries(locationBySeason[loc]).sort((a, b) => b[1] - a[1])[0];
      if (best && best[1] > 0) locationBestSeason[loc] = best[0];
    }
    if (locationByHour[loc]) {
      const best = Object.entries(locationByHour[loc]).sort((a, b) => b[1] - a[1])[0];
      if (best && best[1] > 0) locationBestTime[loc] = best[0];
    }
  });

  // === Time of day ===
  const hourCounts = new Array(24).fill(0);
  catches.forEach((c) => {
    if (c.date && c.date.length > 10) {
      const h = parseInt(c.date.slice(11, 13));
      if (!isNaN(h)) hourCounts[h]++;
    }
  });

  // === Conservation ===
  const conservationStats = getConservationStats(catches);

  const monthRelease = {};
  catches.forEach((c) => {
    if (c.date && c.released !== undefined) {
      const key = c.date.slice(0, 7);
      if (!monthRelease[key]) monthRelease[key] = { released: 0, total: 0 };
      monthRelease[key].total++;
      if (c.released) monthRelease[key].released++;
    }
  });
  const monthlyReleaseRate = Object.entries(monthRelease)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([m, d]) => ({ label: m.slice(5), value: d.total > 0 ? Math.round((d.released / d.total) * 100) : 0 }));

  const releasedSpeciesDonut = conservationStats.topReleasedSpecies
    .slice(0, 10)
    .map((s) => ({ label: s.species, value: s.count }));

  const last30 = catches
    .filter((c) => c.date)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, 30)
    .reverse()
    .map((c) => c.released === true);

  return {
    total: catches.length,
    heaviest,
    longest,
    bestDay,
    bestDayCatches,
    mostRecent,
    speciesPBs,
    currentStreak,
    longestStreak,
    pbTimeline,
    topSpecies,
    speciesSeasonalHeatmap,
    speciesSizeProgression,
    months,
    yearMonth,
    years,
    avgTemp,
    avgPressure,
    avgWind,
    seasonCount,
    tempBucketData,
    pressureBucketData,
    windBuckets: windBuckets2,
    moonPhaseData,
    cloudBucketData,
    bestTempRange,
    bestPressureRange,
    bestWindRange,
    bestMoonPhase,
    topLures,
    lureBySpecies,
    lureBySeason,
    lureByWaterTemp,
    lureBestFor,
    topLocations,
    locationSpecies,
    locationSpeciesCount,
    locationBySeason,
    locationByMonth,
    locationByHour,
    locationBestSeason,
    locationBestTime,
    hourCounts,
    conservationStats,
    monthlyReleaseRate,
    releasedSpeciesDonut,
    last30,
  };
}

/**
 * Compute cross-variable patterns from catch data.
 */
export function computePatterns(catches) {
  if (!catches || catches.length < 10) return [];

  const total = catches.length;
  const enriched = catches.map((c) => {
    const species = c.species ? c.species.trim().toLowerCase() : null;
    const lure = (c.lureName || c.bait || '').trim() || null;
    let season = null;
    let timeSlot = null;
    let weather = null;
    let moon = null;

    if (c.date) {
      const m = parseInt(c.date.slice(5, 7));
      season = getSeason(m);
      if (c.date.length > 10) {
        const h = parseInt(c.date.slice(11, 13));
        if (!isNaN(h)) timeSlot = getTimeSlot(h);
      }
      moon = getMoonPhase(c.date).name;
    }

    if (c.weatherCloudCover !== undefined && c.weatherCloudCover !== '') {
      weather = cloudBucket(Number(c.weatherCloudCover));
    } else if (c.weather) {
      weather = c.weather;
    }

    return { species, lure, season, timeSlot, weather, moon };
  });

  // Count individual variable frequencies for expected-value calculation
  const freq = { species: {}, lure: {}, season: {}, timeSlot: {}, weather: {}, moon: {} };
  enriched.forEach((e) => {
    Object.keys(freq).forEach((k) => {
      if (e[k]) freq[k][e[k]] = (freq[k][e[k]] || 0) + 1;
    });
  });

  const patterns = [];
  const pairKeys = [
    ['species', 'lure'],
    ['species', 'season'],
    ['species', 'timeSlot'],
    ['lure', 'season'],
    ['lure', 'timeSlot'],
    ['species', 'weather'],
    ['species', 'moon'],
    ['lure', 'weather'],
  ];

  // Pairs
  pairKeys.forEach(([k1, k2]) => {
    const combos = {};
    enriched.forEach((e) => {
      if (e[k1] && e[k2]) {
        const key = `${e[k1]}|||${e[k2]}`;
        combos[key] = (combos[key] || 0) + 1;
      }
    });
    Object.entries(combos).forEach(([key, count]) => {
      if (count < 3) return;
      const [v1, v2] = key.split('|||');
      const expected = ((freq[k1][v1] || 0) / total) * ((freq[k2][v2] || 0) / total) * total;
      const multiplier = expected > 0 ? Math.round((count / expected) * 10) / 10 : 0;
      if (multiplier < 1.3) return;
      patterns.push({
        variables: [k1, k2],
        values: { [k1]: v1, [k2]: v2 },
        count,
        percentage: Math.round((count / total) * 1000) / 10,
        multiplier,
        insight: buildInsight({ [k1]: v1, [k2]: v2 }, count, multiplier),
      });
    });
  });

  // Triples
  const tripleKeys = [
    ['species', 'lure', 'season'],
    ['species', 'lure', 'timeSlot'],
    ['species', 'season', 'timeSlot'],
    ['species', 'lure', 'weather'],
  ];

  tripleKeys.forEach(([k1, k2, k3]) => {
    const combos = {};
    enriched.forEach((e) => {
      if (e[k1] && e[k2] && e[k3]) {
        const key = `${e[k1]}|||${e[k2]}|||${e[k3]}`;
        combos[key] = (combos[key] || 0) + 1;
      }
    });
    Object.entries(combos).forEach(([key, count]) => {
      if (count < 3) return;
      const [v1, v2, v3] = key.split('|||');
      const expected = ((freq[k1][v1] || 0) / total) * ((freq[k2][v2] || 0) / total) * ((freq[k3][v3] || 0) / total) * total;
      const multiplier = expected > 0 ? Math.round((count / expected) * 10) / 10 : 0;
      if (multiplier < 1.5) return;
      patterns.push({
        variables: [k1, k2, k3],
        values: { [k1]: v1, [k2]: v2, [k3]: v3 },
        count,
        percentage: Math.round((count / total) * 1000) / 10,
        multiplier,
        insight: buildInsight({ [k1]: v1, [k2]: v2, [k3]: v3 }, count, multiplier),
      });
    });
  });

  return patterns.sort((a, b) => b.count - a.count).slice(0, 20);
}

function buildInsight(values, count, multiplier) {
  const parts = [];
  if (values.species) parts.push(`catch ${values.species}`);
  if (values.lure) parts.push(`using ${values.lure}`);
  if (values.season) parts.push(`in ${values.season}`);
  if (values.timeSlot) parts.push(`during ${values.timeSlot}`);
  if (values.weather) parts.push(`in ${values.weather} conditions`);
  if (values.moon) parts.push(`during ${values.moon}`);

  const multi = multiplier >= 2 ? ` (${multiplier}x more than average)` : '';
  return `You ${parts.join(' ')} — ${count} catches${multi}`;
}

/**
 * Build a condensed summary of catch data for AI Coach prompts.
 */
export function buildCatchSummary(catches) {
  if (!catches || !catches.length) return 'No catch data available.';

  const total = catches.length;
  const dates = catches.filter((c) => c.date).map((c) => c.date.slice(0, 10)).sort();
  const dateRange = dates.length ? `${dates[0]} to ${dates[dates.length - 1]}` : 'unknown';

  const speciesCount = {};
  catches.forEach((c) => {
    if (c.species) {
      const s = c.species.trim().toLowerCase();
      speciesCount[s] = (speciesCount[s] || 0) + 1;
    }
  });
  const topSpecies = Object.entries(speciesCount).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const locationCount = {};
  catches.forEach((c) => {
    if (c.location) {
      locationCount[c.location.trim()] = (locationCount[c.location.trim()] || 0) + 1;
    }
  });
  const topLocations = Object.entries(locationCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const lureCount = {};
  catches.forEach((c) => {
    const lure = c.lureName || c.bait;
    if (lure) lureCount[lure.trim()] = (lureCount[lure.trim()] || 0) + 1;
  });
  const topLures = Object.entries(lureCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const withWeight = catches.filter((c) => c.weight);
  const pb = withWeight.length ? withWeight.reduce((a, b) => (a.weight > b.weight ? a : b)) : null;

  const seasonCount = { Spring: 0, Summer: 0, Fall: 0, Winter: 0 };
  catches.forEach((c) => {
    if (c.date) seasonCount[getSeason(parseInt(c.date.slice(5, 7)))]++;
  });
  const bestSeason = Object.entries(seasonCount).sort((a, b) => b[1] - a[1])[0];

  const weatherTemps = catches.filter((c) => c.weatherTemp).map((c) => Number(c.weatherTemp));
  const avgTemp = weatherTemps.length ? Math.round(weatherTemps.reduce((s, t) => s + t, 0) / weatherTemps.length) : null;

  // Recent monthly trend
  const monthCounts = {};
  catches.forEach((c) => {
    if (c.date) {
      const m = c.date.slice(0, 7);
      monthCounts[m] = (monthCounts[m] || 0) + 1;
    }
  });
  const recentMonths = Object.entries(monthCounts).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 3);

  const released = catches.filter((c) => c.released === true).length;

  let summary = `Angler's Catch Data Summary:\n`;
  summary += `- Total catches: ${total}\n`;
  summary += `- Date range: ${dateRange}\n`;
  summary += `- Top species: ${topSpecies.map(([s, c]) => `${s} (${c})`).join(', ')}\n`;
  summary += `- Top locations: ${topLocations.map(([l, c]) => `${l} (${c})`).join(', ')}\n`;
  summary += `- Top lures/baits: ${topLures.map(([l, c]) => `${l} (${c})`).join(', ')}\n`;
  summary += `- Best season: ${bestSeason[0]} (${bestSeason[1]} catches)\n`;
  if (avgTemp) summary += `- Avg weather temp at catch: ${avgTemp}°F\n`;
  if (pb) summary += `- Personal best: ${pb.weight} lbs ${pb.species || ''}\n`;
  summary += `- Release rate: ${total > 0 ? Math.round((released / total) * 100) : 0}%\n`;
  if (recentMonths.length) {
    summary += `- Recent trend: ${recentMonths.map(([m, c]) => `${m}: ${c} catches`).join(', ')}\n`;
  }

  return summary;
}
