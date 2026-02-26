import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
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

export async function fetchCommunityHeatmapPoints(excludeUserId) {
  // Get users who opted in to heatmap sharing
  const usersSnap = await getDocs(
    query(collection(db, 'users'), where('heatmapOptIn', '==', true))
  );
  const userIds = usersSnap.docs
    .map((d) => d.id)
    .filter((id) => id !== excludeUserId);

  if (!userIds.length) return [];

  // Firestore 'in' supports up to 30 values; batch if needed
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
    console.error('Firestore subscription error:', error);
  });
}
