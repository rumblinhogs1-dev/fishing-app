export const SHARE_LEVELS = [
  {
    key: 'private',
    label: 'Private',
    points: 0,
    description: 'Your catch locations stay completely private.',
  },
  {
    key: 'waterBody',
    label: 'Water Body Only',
    points: 1,
    description: 'Share which lake or river, but not your exact spot.',
  },
  {
    key: 'generalArea',
    label: 'General Area',
    points: 3,
    description: 'Share an approximate location (~1 mile radius).',
  },
  {
    key: 'exactLocation',
    label: 'Exact Location',
    points: 5,
    description: 'Share your precise GPS coordinates with the community.',
  },
];

export function getPointsForLevel(key) {
  const level = SHARE_LEVELS.find((l) => l.key === key);
  return level ? level.points : 0;
}

/**
 * Backward compat: migrate old boolean heatmapOptIn to new share level.
 * Old `true` → 'waterBody', old `false`/missing → 'private'.
 */
export function migrateShareLevel(heatmapOptIn, heatmapShareLevel) {
  if (heatmapShareLevel) return heatmapShareLevel;
  return heatmapOptIn ? 'waterBody' : 'private';
}
