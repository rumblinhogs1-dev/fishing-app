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
  arrayUnion,
  arrayRemove,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';

const TRIPS_COL = 'trips';

export async function addTrip(userId, data) {
  const invitedIds = data.invitedIds || [];
  const members = data.members || [];
  const docRef = await addDoc(collection(db, TRIPS_COL), {
    ...data,
    userId,
    memberIds: [userId, ...invitedIds],
    members,
    status: 'planned',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateTrip(tripId, updates) {
  const ref = doc(db, TRIPS_COL, tripId);
  await updateDoc(ref, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTrip(tripId) {
  const ref = doc(db, TRIPS_COL, tripId);
  await deleteDoc(ref);
}

export function subscribeToTrips(userId, callback) {
  const q = query(
    collection(db, TRIPS_COL),
    where('memberIds', 'array-contains', userId)
  );
  return onSnapshot(q, (snapshot) => {
    const trips = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: d.data().updatedAt?.toDate?.()?.toISOString() || null,
    }));
    trips.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    callback(trips);
  }, (error) => {
    console.error('Firestore subscription error:', error);
    callback([]);
  });
}

export async function inviteToTrip(tripId, userId) {
  const ref = doc(db, TRIPS_COL, tripId);
  await updateDoc(ref, {
    memberIds: arrayUnion(userId),
    updatedAt: serverTimestamp(),
  });
}

export async function removeFromTrip(tripId, userId) {
  const ref = doc(db, TRIPS_COL, tripId);
  await updateDoc(ref, {
    memberIds: arrayRemove(userId),
    updatedAt: serverTimestamp(),
  });
}

export async function backfillMemberIds(userId) {
  const q = query(
    collection(db, TRIPS_COL),
    where('userId', '==', userId)
  );
  const snap = await getDocs(q);
  const updates = [];
  snap.docs.forEach((d) => {
    if (!d.data().memberIds) {
      updates.push(updateDoc(d.ref, { memberIds: [userId] }));
    }
  });
  await Promise.all(updates);
}

export function generateChecklist(targetSpecies, forecast, tackleItems) {
  const checklist = [];

  // Essentials
  checklist.push({ text: 'Fishing license', category: 'essentials', packed: false });
  checklist.push({ text: 'Water & snacks', category: 'essentials', packed: false });
  checklist.push({ text: 'First aid kit', category: 'essentials', packed: false });
  checklist.push({ text: 'Sunscreen', category: 'essentials', packed: false });
  checklist.push({ text: 'Phone & charger', category: 'essentials', packed: false });

  // Weather-based
  if (forecast) {
    const today = forecast.days?.[0];
    if (today) {
      if (today.precip > 0.1) {
        checklist.push({ text: 'Rain gear / waterproof jacket', category: 'weather', packed: false });
      }
      if (today.tempMin != null && today.tempMin < 50) {
        checklist.push({ text: 'Warm layers / jacket', category: 'weather', packed: false });
      }
      if (today.tempMax != null && today.tempMax > 80) {
        checklist.push({ text: 'Hat & sunglasses', category: 'weather', packed: false });
      }
      if (today.windMax != null && today.windMax > 15) {
        checklist.push({ text: 'Windbreaker', category: 'weather', packed: false });
      }
    }
  }

  // Species-based tackle suggestions
  const speciesLower = (targetSpecies || '').toLowerCase();
  const lureItems = (tackleItems || []).filter((i) => i.category === 'lure');

  if (speciesLower.includes('bass')) {
    const suggestions = ['Soft Plastic', 'Crankbait', 'Spinnerbait', 'Jig', 'Topwater'];
    suggestions.forEach((s) => {
      const owned = lureItems.find((i) => i.name.toLowerCase().includes(s.toLowerCase()));
      checklist.push({
        text: owned ? `${owned.name} (from tackle box)` : `${s} (recommended)`,
        category: 'tackle',
        packed: false,
      });
    });
  } else if (speciesLower.includes('trout')) {
    const suggestions = ['Spoon', 'Fly', 'Soft Plastic'];
    suggestions.forEach((s) => {
      const owned = lureItems.find((i) => i.name.toLowerCase().includes(s.toLowerCase()));
      checklist.push({
        text: owned ? `${owned.name} (from tackle box)` : `${s} (recommended)`,
        category: 'tackle',
        packed: false,
      });
    });
  } else if (speciesLower.includes('catfish')) {
    checklist.push({ text: 'Circle hooks', category: 'tackle', packed: false });
    checklist.push({ text: 'Sinkers (heavy)', category: 'tackle', packed: false });
    checklist.push({ text: 'Bait (chicken liver, worms)', category: 'tackle', packed: false });
  } else if (speciesLower.includes('walleye')) {
    const suggestions = ['Jig', 'Crankbait', 'Spoon'];
    suggestions.forEach((s) => {
      const owned = lureItems.find((i) => i.name.toLowerCase().includes(s.toLowerCase()));
      checklist.push({
        text: owned ? `${owned.name} (from tackle box)` : `${s} (recommended)`,
        category: 'tackle',
        packed: false,
      });
    });
  } else {
    checklist.push({ text: 'Rod & reel', category: 'tackle', packed: false });
    checklist.push({ text: 'Tackle selection', category: 'tackle', packed: false });
    checklist.push({ text: 'Extra line', category: 'tackle', packed: false });
  }

  // General tackle
  checklist.push({ text: 'Pliers / multi-tool', category: 'tackle', packed: false });
  checklist.push({ text: 'Net', category: 'tackle', packed: false });
  checklist.push({ text: 'Stringer or cooler', category: 'tackle', packed: false });

  return checklist;
}
