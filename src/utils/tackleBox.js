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

const TACKLE_COL = 'tackleBox';

export const CATEGORIES = {
  lure: {
    label: 'Lures',
    presets: ['Crankbait', 'Spinnerbait', 'Soft Plastic', 'Jig', 'Topwater', 'Spoon', 'Fly'],
  },
  hook: {
    label: 'Terminal Tackle',
    presets: ['Hooks', 'Sinkers', 'Swivels', 'Bobbers'],
  },
  line: {
    label: 'Line',
    presets: ['Mono 10lb', 'Mono 20lb', 'Braid 30lb', 'Braid 50lb', 'Fluoro 12lb', 'Fluoro 15lb'],
  },
  accessory: {
    label: 'Accessories',
    presets: ['Pliers', 'Scale', 'Net', 'Stringer', 'Tackle Box', 'Rod Holder'],
  },
};

export async function addTackleItem(userId, data) {
  const docRef = await addDoc(collection(db, TACKLE_COL), {
    ...data,
    userId,
    packed: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateTackleItem(itemId, updates) {
  const ref = doc(db, TACKLE_COL, itemId);
  await updateDoc(ref, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTackleItem(itemId) {
  const ref = doc(db, TACKLE_COL, itemId);
  await deleteDoc(ref);
}

export function subscribeToTackleBox(userId, callback) {
  const q = query(
    collection(db, TACKLE_COL),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: d.data().updatedAt?.toDate?.()?.toISOString() || null,
    }));
    callback(items);
  }, (error) => {
    console.error('Firestore subscription error:', error);
    callback([]);
  });
}
