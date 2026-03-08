import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getPointsForLevel } from '../config/heatmapSharing';

export async function trackContributionPoints(userId) {
  if (!userId || !db) return;

  const ref = doc(db, 'users', userId);
  const snap = await getDoc(ref);
  const data = snap.data() || {};
  const level = data.heatmapShareLevel || (data.heatmapOptIn ? 'waterBody' : 'private');
  const points = getPointsForLevel(level);

  if (points === 0) return;

  const { increment } = await import('firebase/firestore');
  await updateDoc(ref, {
    contributionPoints: increment(points),
  });
}
