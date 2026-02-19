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

const CATCHES_COL = 'catches';

export async function addCatch(userId, data) {
  const docRef = await addDoc(collection(db, CATCHES_COL), {
    ...data,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateCatch(catchId, updates) {
  const ref = doc(db, CATCHES_COL, catchId);
  await updateDoc(ref, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCatch(catchId) {
  const ref = doc(db, CATCHES_COL, catchId);
  await deleteDoc(ref);
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
    callback([]);
  });
}
