import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

const SPOTS_COL = 'spots';

export async function addSpot(userId, data) {
  const docRef = await addDoc(collection(db, SPOTS_COL), {
    ...data,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateSpot(spotId, updates) {
  const ref = doc(db, SPOTS_COL, spotId);
  await updateDoc(ref, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteSpot(spotId) {
  const ref = doc(db, SPOTS_COL, spotId);
  await deleteDoc(ref);
}

export function subscribeToSpots(userId, callback) {
  const q = query(
    collection(db, SPOTS_COL),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const spots = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: d.data().updatedAt?.toDate?.()?.toISOString() || null,
    }));
    callback(spots);
  }, (error) => {
    console.error('Firestore subscription error:', error);
    callback([]);
  });
}
