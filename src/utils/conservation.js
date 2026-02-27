export const BADGES = [
  {
    id: 'firstRelease',
    name: 'First Release',
    description: 'Release your first fish',
    icon: 'M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20c2.21 0 4-1.79 4-4h-2a2 2 0 0 1-2 2 2.13 2.13 0 0 1-1.53-.67L12 4h2l-1 4h4l-1 4h4L17 8z',
    color: '#4caf50',
  },
  {
    id: 'guardian',
    name: 'Guardian',
    description: 'Release 10 fish back to the water',
    icon: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v4.7c0 4.83-3.4 9.36-7 10.58-3.6-1.22-7-5.75-7-10.58V6.3l7-3.12z',
    color: '#2d6a4f',
  },
  {
    id: 'conservationist',
    name: 'Conservationist',
    description: 'Release 50 fish — a true steward of the water',
    icon: 'M22 9.74l-2 1V7.5L12 2 4 7.5v3.24l-2-1V6l10-5 10 5v3.74zM12 24C6.48 24 2 20.93 2 17v-4l10-5 10 5v4c0 3.93-4.48 7-10 7zm0-11.54L4.47 14 4 14.25V17c0 2.76 3.58 5 8 5s8-2.24 8-5v-2.75l-.47-.25L12 12.46z',
    color: '#2e7d32',
  },
  {
    id: 'riverKeeper',
    name: 'River Keeper',
    description: 'Log 20+ catches with a 90%+ release rate',
    icon: 'M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8zm0 18c-3.35 0-6-2.57-6-6.2 0-2.34 1.95-5.44 6-9.14 4.05 3.7 6 6.8 6 9.14 0 3.63-2.65 6.2-6 6.2z',
    color: '#0288d1',
  },
  {
    id: 'speciesProtector',
    name: 'Species Protector',
    description: 'Release 10 different species',
    icon: 'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm0 2C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10zm-1-10V7.5L7.5 12 11 16.5V14h4v-2h-4z',
    color: '#7b1fa2',
  },
  {
    id: 'streakMaster',
    name: 'Streak Master',
    description: '10 consecutive released catches',
    icon: 'M13.5 0.67s0.74 2.65 0.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z',
    color: '#e65100',
  },
  {
    id: 'seasonalSteward',
    name: 'Seasonal Steward',
    description: 'Release fish in all 4 seasons with 80%+ release rate',
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
    color: '#00897b',
  },
];

function getSeason(dateStr) {
  if (!dateStr) return null;
  const m = parseInt(dateStr.slice(5, 7));
  if (m >= 3 && m <= 5) return 'Spring';
  if (m >= 6 && m <= 8) return 'Summer';
  if (m >= 9 && m <= 11) return 'Fall';
  return 'Winter';
}

export function getConservationStats(catches) {
  if (!catches || catches.length === 0) {
    return {
      totalReleased: 0,
      yearReleased: 0,
      releaseRate: 0,
      yearReleaseRate: 0,
      topReleasedSpecies: [],
      currentStreak: 0,
      longestStreak: 0,
      uniqueReleasedSpecies: 0,
    };
  }

  const released = catches.filter((c) => c.released === true);
  const totalReleased = released.length;
  const withReleasedField = catches.filter((c) => c.released !== undefined);
  const releaseRate = withReleasedField.length > 0
    ? Math.round((totalReleased / withReleasedField.length) * 100)
    : 0;

  const currentYear = new Date().getFullYear().toString();
  const yearCatches = catches.filter((c) => c.date && c.date.startsWith(currentYear));
  const yearReleasedArr = yearCatches.filter((c) => c.released === true);
  const yearWithField = yearCatches.filter((c) => c.released !== undefined);
  const yearReleased = yearReleasedArr.length;
  const yearReleaseRate = yearWithField.length > 0
    ? Math.round((yearReleased / yearWithField.length) * 100)
    : 0;

  const speciesCounts = {};
  released.forEach((c) => {
    if (c.species) {
      const s = c.species.trim().toLowerCase();
      speciesCounts[s] = (speciesCounts[s] || 0) + 1;
    }
  });
  const topReleasedSpecies = Object.entries(speciesCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([species, count]) => ({ species, count }));

  const uniqueReleasedSpecies = Object.keys(speciesCounts).length;

  // Streak calculation — sort by date descending
  const sorted = [...catches]
    .filter((c) => c.released !== undefined && c.date)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  let currentStreak = 0;
  for (const c of sorted) {
    if (c.released === true) currentStreak++;
    else break;
  }

  let longestStreak = 0;
  let streak = 0;
  // For longest streak, go chronologically
  const chronological = [...sorted].reverse();
  for (const c of chronological) {
    if (c.released === true) {
      streak++;
      if (streak > longestStreak) longestStreak = streak;
    } else {
      streak = 0;
    }
  }

  return {
    totalReleased,
    yearReleased,
    releaseRate,
    yearReleaseRate,
    topReleasedSpecies,
    currentStreak,
    longestStreak,
    uniqueReleasedSpecies,
  };
}

export function evaluateBadges(catches) {
  const stats = getConservationStats(catches);
  const withField = catches.filter((c) => c.released !== undefined);
  const totalCatches = withField.length;
  const releaseRate = stats.releaseRate;

  // Seasons with releases
  const releasedSeasons = new Set();
  catches
    .filter((c) => c.released === true && c.date)
    .forEach((c) => {
      const season = getSeason(c.date);
      if (season) releasedSeasons.add(season);
    });

  const results = {};

  // First Release
  results.firstRelease = {
    earned: stats.totalReleased >= 1,
    progress: Math.min(stats.totalReleased, 1),
    target: 1,
  };

  // Guardian
  results.guardian = {
    earned: stats.totalReleased >= 10,
    progress: Math.min(stats.totalReleased, 10),
    target: 10,
  };

  // Conservationist
  results.conservationist = {
    earned: stats.totalReleased >= 50,
    progress: Math.min(stats.totalReleased, 50),
    target: 50,
  };

  // River Keeper
  const rkCatchesMet = totalCatches >= 20;
  const rkRateMet = releaseRate >= 90;
  results.riverKeeper = {
    earned: rkCatchesMet && rkRateMet,
    progress: rkCatchesMet ? (rkRateMet ? 90 : releaseRate) : Math.min(totalCatches, 20),
    target: rkCatchesMet ? 90 : 20,
    phase: rkCatchesMet ? 'rate' : 'catches',
  };

  // Species Protector
  results.speciesProtector = {
    earned: stats.uniqueReleasedSpecies >= 10,
    progress: Math.min(stats.uniqueReleasedSpecies, 10),
    target: 10,
  };

  // Streak Master
  results.streakMaster = {
    earned: stats.longestStreak >= 10,
    progress: Math.min(stats.longestStreak, 10),
    target: 10,
  };

  // Seasonal Steward
  const ssSeasonsMet = releasedSeasons.size >= 4;
  const ssRateMet = releaseRate >= 80;
  results.seasonalSteward = {
    earned: ssSeasonsMet && ssRateMet,
    progress: ssSeasonsMet ? (ssRateMet ? 80 : releaseRate) : releasedSeasons.size,
    target: ssSeasonsMet ? 80 : 4,
    phase: ssSeasonsMet ? 'rate' : 'seasons',
  };

  return results;
}

export function getCommunityImpact(publicCatches) {
  if (!publicCatches || publicCatches.length === 0) {
    return { monthReleasedCount: 0, communityReleaseRate: 0, topConservationists: [] };
  }

  const released = publicCatches.filter((c) => c.released === true);
  const withField = publicCatches.filter((c) => c.released !== undefined);
  const monthReleasedCount = released.length;
  const communityReleaseRate = withField.length > 0
    ? Math.round((released.length / withField.length) * 100)
    : 0;

  // Top conservationists by released count
  const userReleased = {};
  const userMap = {};
  released.forEach((c) => {
    userReleased[c.userId] = (userReleased[c.userId] || 0) + 1;
    if (!userMap[c.userId]) {
      userMap[c.userId] = {
        userId: c.userId,
        displayName: c.authorDisplayName || 'Angler',
        photoURL: c.authorPhotoURL || null,
      };
    }
  });

  const topConservationists = Object.entries(userReleased)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([userId, count], i) => ({
      rank: i + 1,
      userId,
      displayName: userMap[userId]?.displayName || 'Angler',
      photoURL: userMap[userId]?.photoURL,
      value: `${count} released`,
    }));

  return { monthReleasedCount, communityReleaseRate, topConservationists };
}
