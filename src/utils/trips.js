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
  getDoc,
  Timestamp,
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

export async function addMemberToTrip(tripId, memberProfile) {
  const ref = doc(db, TRIPS_COL, tripId);
  await updateDoc(ref, {
    memberIds: arrayUnion(memberProfile.userId),
    invitedIds: arrayUnion(memberProfile.userId),
    members: arrayUnion(memberProfile),
    updatedAt: serverTimestamp(),
  });
}

export async function removeMemberFromTrip(tripId, userId) {
  const ref = doc(db, TRIPS_COL, tripId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  await updateDoc(ref, {
    memberIds: (data.memberIds || []).filter((id) => id !== userId),
    invitedIds: (data.invitedIds || []).filter((id) => id !== userId),
    members: (data.members || []).filter((m) => m.userId !== userId),
    updatedAt: serverTimestamp(),
  });
}

export async function addItineraryItem(tripId, { time, description }) {
  const ref = doc(db, TRIPS_COL, tripId);
  const id = `itin_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  await updateDoc(ref, {
    itinerary: arrayUnion({ id, time, description }),
    updatedAt: serverTimestamp(),
  });
}

export async function removeItineraryItem(tripId, itemId) {
  const ref = doc(db, TRIPS_COL, tripId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  const filtered = (data.itinerary || []).filter((item) => item.id !== itemId);
  await updateDoc(ref, {
    itinerary: filtered,
    updatedAt: serverTimestamp(),
  });
}

export async function getTripCatches(memberIds, startDate, endDate) {
  if (!memberIds?.length || !startDate || !endDate) return [];
  const start = Timestamp.fromDate(new Date(startDate));
  const end = Timestamp.fromDate(new Date(endDate));
  const allCatches = [];
  // Query each member separately — Firestore can't combine 'in' with range on different fields
  for (const uid of memberIds) {
    const q = query(
      collection(db, 'catches'),
      where('userId', '==', uid),
      where('createdAt', '>=', start),
      where('createdAt', '<=', end),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    snap.docs.forEach((d) => {
      const c = d.data();
      if (c.visibility === 'private') return;
      allCatches.push({
        id: d.id,
        ...c,
        createdAt: c.createdAt?.toDate?.()?.toISOString() || null,
      });
    });
  }
  allCatches.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return allCatches;
}

