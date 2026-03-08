export const TIERS = {
  free: {
    name: 'Free',
    price: 0,
    annualPrice: 0,
    period: null,
    features: {
      maxCatchesPerMonth: 10,
      aiIdentifications: 3,
      localGuide: 2,
      lureRecommendations: 2,
      advancedStats: false,
      tripPlanner: 1,
      sonarImport: false,
      prioritySupport: false,
      customBadges: false,
      exportData: false,
    },
    description: 'Get started with the basics',
    highlights: [
      'Log up to 10 catches/month',
      '3 AI fish identifications/month',
      '2 Local Guide searches/month',
      '2 lure recommendations/month',
      '1 active trip',
      'Community feed & leaderboard',
      'Map view & heatmap',
      'Stocking reports (5 states)',
    ],
  },
  angler: {
    name: 'Angler',
    price: 4.99,
    annualPrice: 49,
    period: 'month',
    features: {
      maxCatchesPerMonth: Infinity,
      aiIdentifications: 30,
      localGuide: true,
      lureRecommendations: true,
      advancedStats: true,
      tripPlanner: true,
      sonarImport: false,
      prioritySupport: false,
      customBadges: true,
      exportData: true,
    },
    description: 'For the dedicated angler',
    highlights: [
      'Unlimited catch logging',
      '30 AI identifications/month',
      'Unlimited Local Guide searches',
      'Unlimited lure recommendations',
      'Advanced stats & insights',
      'Unlimited trip planner',
      'Data export (CSV)',
      'Conservation badges',
    ],
  },
  pro_guide: {
    name: 'Pro Guide',
    price: 7.99,
    annualPrice: 79,
    period: 'month',
    features: {
      maxCatchesPerMonth: Infinity,
      aiIdentifications: Infinity,
      localGuide: true,
      lureRecommendations: true,
      advancedStats: true,
      tripPlanner: true,
      sonarImport: true,
      prioritySupport: true,
      customBadges: true,
      exportData: true,
    },
    description: 'Everything, unlimited',
    highlights: [
      'Everything in Angler, plus:',
      'Unlimited AI identifications',
      'Sonar data import',
      'Priority support',
      'Pro Guide badge',
    ],
  },
};

export const TIER_ORDER = ['free', 'angler', 'pro_guide'];

/**
 * Check whether a given tier includes a specific feature.
 * @param {string} tierKey - 'free', 'angler', or 'pro_guide'
 * @param {string} featureName - key from the features object
 * @returns {boolean|number}
 */
export function hasFeature(tierKey, featureName) {
  const tier = TIERS[tierKey] || TIERS.free;
  const value = tier.features[featureName];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  return false;
}
