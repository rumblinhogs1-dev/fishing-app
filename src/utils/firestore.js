import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { validateCatch } from './validate';

const CATCHES_COL = 'catches';

export async function addCatch(userId, data) {
  const clean = validateCatch(data);
  const docRef = await addDoc(collection(db, CATCHES_COL), {
    ...clean,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateCatch(catchId, updates) {
  const clean = validateCatch(updates);
  const ref = doc(db, CATCHES_COL, catchId);
  await updateDoc(ref, {
    ...clean,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCatch(catchId) {
  const ref = doc(db, CATCHES_COL, catchId);
  await deleteDoc(ref);
}

/** @deprecated Use fetchCommunityHeatmapData instead */
export async function fetchCommunityHeatmapPoints(excludeUserId) {
  const usersSnap = await getDocs(
    query(collection(db, 'users'), where('heatmapOptIn', '==', true))
  );
  const userIds = usersSnap.docs
    .map((d) => d.id)
    .filter((id) => id !== excludeUserId);

  if (!userIds.length) return [];

  const points = [];
  for (let i = 0; i < userIds.length; i += 30) {
    const batch = userIds.slice(i, i + 30);
    const snap = await getDocs(
      query(
        collection(db, CATCHES_COL),
        where('userId', 'in', batch),
        where('visibility', '==', 'public'),
        limit(500)
      )
    );
    snap.docs.forEach((d) => {
      const data = d.data();
      if (data.lat && data.lng) {
        points.push({ lat: data.lat, lng: data.lng });
      }
    });
  }
  return points;
}

/**
 * Fetch community heatmap data with tiered sharing levels.
 * Returns { waterBodyAggregates: [...], heatPoints: [...] }
 */
export async function fetchCommunityHeatmapData(excludeUserId) {
  // Get users who opted in via new share level OR legacy heatmapOptIn
  const usersSnap = await getDocs(collection(db, 'users'));
  const sharingUsers = [];

  usersSnap.docs.forEach((d) => {
    if (d.id === excludeUserId) return;
    const data = d.data();
    const level = data.heatmapShareLevel;
    if (level && level !== 'private') {
      sharingUsers.push({ id: d.id, level });
    } else if (!level && data.heatmapOptIn) {
      // Legacy migration: old boolean opt-in → waterBody
      sharingUsers.push({ id: d.id, level: 'waterBody' });
    }
  });

  if (!sharingUsers.length) return { waterBodyAggregates: [], heatPoints: [] };

  // Build lookup: userId → shareLevel
  const levelMap = {};
  sharingUsers.forEach((u) => { levelMap[u.id] = u.level; });
  const userIds = sharingUsers.map((u) => u.id);

  // Fetch catches in batches of 30
  const allCatches = [];
  for (let i = 0; i < userIds.length; i += 30) {
    const batch = userIds.slice(i, i + 30);
    const snap = await getDocs(
      query(
        collection(db, CATCHES_COL),
        where('userId', 'in', batch),
        where('visibility', '==', 'public'),
        limit(500)
      )
    );
    snap.docs.forEach((d) => {
      const data = d.data();
      if (data.lat && data.lng) {
        allCatches.push({ ...data, _shareLevel: levelMap[data.userId] });
      }
    });
  }

  // Process by share level
  const waterBodyMap = new Map();
  const heatPoints = [];

  allCatches.forEach((c) => {
    const level = c._shareLevel;

    if (level === 'waterBody') {
      const wb = c.waterBody || c.location || 'Unknown Water';
      if (!waterBodyMap.has(wb)) {
        waterBodyMap.set(wb, { waterBody: wb, species: {}, totalCatches: 0, latSum: 0, lngSum: 0 });
      }
      const agg = waterBodyMap.get(wb);
      agg.totalCatches++;
      agg.latSum += c.lat;
      agg.lngSum += c.lng;
      if (c.species) {
        agg.species[c.species] = (agg.species[c.species] || 0) + 1;
      }
    } else if (level === 'generalArea') {
      // Fuzz coordinates ±0.015° (~1 mile)
      const fuzz = () => (Math.random() - 0.5) * 0.03;
      heatPoints.push({ lat: c.lat + fuzz(), lng: c.lng + fuzz(), species: c.species });
    } else if (level === 'exactLocation') {
      heatPoints.push({ lat: c.lat, lng: c.lng, species: c.species });
    }
  });

  // Convert water body map to aggregates array
  const waterBodyAggregates = [];
  waterBodyMap.forEach((agg) => {
    const speciesArr = Object.entries(agg.species)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    waterBodyAggregates.push({
      waterBody: agg.waterBody,
      species: speciesArr,
      totalCatches: agg.totalCatches,
      lat: agg.latSum / agg.totalCatches,
      lng: agg.lngSum / agg.totalCatches,
    });
  });

  return { waterBodyAggregates, heatPoints };
}

export function subscribeToCatches(userId, callback) {
  const q = query(
    collection(db, CATCHES_COL),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const catches = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: d.data().updatedAt?.toDate?.()?.toISOString() || null,
    }));
    callback(catches);
  }, (error) => {
  });
}
