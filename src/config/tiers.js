export const TIERS = {
  free: {
    name: 'Free',
    price: 0,
    period: null,
    features: {
      maxCatchesPerMonth: 20,
      aiIdentifications: 5,
      localGuide: false,
      lureRecommendations: false,
      advancedStats: false,
      tripPlanner: false,
      sonarImport: false,
      prioritySupport: false,
      customBadges: false,
      exportData: false,
    },
    description: 'Get started with the basics',
    highlights: [
      'Log up to 20 catches/month',
      '5 AI fish identifications/month',
      'Community feed & leaderboard',
      'Basic catch stats',
      'Map view',
    ],
  },
  angler: {
    name: 'Angler',
    price: 4.99,
    period: 'month',
    features: {
      maxCatchesPerMonth: Infinity,
      aiIdentifications: 50,
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
      '50 AI identifications/month',
      'AI Local Guide access',
      'Lure recommendations',
      'Advanced stats & insights',
      'Trip planner',
      'Data export',
    ],
  },
  pro_guide: {
    name: 'Pro Guide',
    price: 14.99,
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
