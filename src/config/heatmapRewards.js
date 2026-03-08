export const MILESTONES = [
  {
    key: 'scout',
    label: 'Scout',
    points: 10,
    color: '#8d6e63',
    icon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z',
    reward: 'You started mapping the waters!',
  },
  {
    key: 'contributor',
    label: 'Contributor',
    points: 50,
    color: '#43a047',
    icon: 'M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z',
    reward: 'Your data is helping fellow anglers.',
  },
  {
    key: 'mapMaker',
    label: 'Map Maker',
    points: 100,
    color: '#1565c0',
    icon: 'M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z',
    reward: 'You\'re building the community map!',
  },
  {
    key: 'trailblazer',
    label: 'Trailblazer',
    points: 250,
    color: '#e65100',
    icon: 'M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z',
    reward: 'You\'re a legendary community mapper!',
  },
  {
    key: 'legend',
    label: 'Legend',
    points: 500,
    color: '#ffd600',
    icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    reward: 'The ultimate community contributor!',
  },
];

export function getCurrentMilestone(points) {
  let current = null;
  for (const m of MILESTONES) {
    if (points >= m.points) current = m;
  }
  return current;
}

export function getNextMilestone(points) {
  for (const m of MILESTONES) {
    if (points < m.points) return m;
  }
  return null;
}
