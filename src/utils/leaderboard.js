import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

export async function getRegionUserIds(region) {
  if (!region) return [];
  const q = query(
    collection(db, 'users'),
    where('region', '==', region)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.id);
}

export async function getMonthlyRegionCatches(region) {
  const userIds = await getRegionUserIds(region);
  if (!userIds.length) return [];
  const results = [];
  for (let i = 0; i < userIds.length; i += 30) {
    const batch = userIds.slice(i, i + 30);
    const q = query(
      collection(db, 'catches'),
      where('userId', 'in', batch),
      where('visibility', 'in', ['public', 'friends']),
      where('createdAt', '>=', getMonthStart()),
      orderBy('createdAt', 'desc'),
      limit(500)
    );
    const snap = await getDocs(q);
    results.push(...snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }
  return results;
}

export async function getAllRegionCatches(region) {
  const userIds = await getRegionUserIds(region);
  if (!userIds.length) return [];
  const results = [];
  for (let i = 0; i < userIds.length; i += 30) {
    const batch = userIds.slice(i, i + 30);
    const q = query(
      collection(db, 'catches'),
      where('userId', 'in', batch),
      where('visibility', 'in', ['public', 'friends']),
      orderBy('createdAt', 'desc'),
      limit(1000)
    );
    const snap = await getDocs(q);
    results.push(...snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }
  return results;
}

function getMonthStart() {
  const now = new Date();
  return Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth(), 1));
}

export async function getMonthlyPublicCatches() {
  const q = query(
    collection(db, 'catches'),
    where('visibility', '==', 'public'),
    where('createdAt', '>=', getMonthStart()),
    orderBy('createdAt', 'desc'),
    limit(500)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getAllPublicCatches() {
  const q = query(
    collection(db, 'catches'),
    where('visibility', '==', 'public'),
    orderBy('createdAt', 'desc'),
    limit(1000)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getMonthlyFriendsCatches(friendIds) {
  if (!friendIds?.length) return [];
  const ids = friendIds.slice(0, 30);
  const q = query(
    collection(db, 'catches'),
    where('userId', 'in', ids),
    where('visibility', 'in', ['public', 'friends']),
    where('createdAt', '>=', getMonthStart()),
    orderBy('createdAt', 'desc'),
    limit(500)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getAllFriendsCatches(friendIds) {
  if (!friendIds?.length) return [];
  const ids = friendIds.slice(0, 30);
  const q = query(
    collection(db, 'catches'),
    where('userId', 'in', ids),
    where('visibility', 'in', ['public', 'friends']),
    orderBy('createdAt', 'desc'),
    limit(1000)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

function buildUserMap(catches) {
  const map = {};
  catches.forEach((c) => {
    if (!map[c.userId]) {
      map[c.userId] = {
        userId: c.userId,
        displayName: c.authorDisplayName || 'Angler',
        photoURL: c.authorPhotoURL || null,
      };
    }
  });
  return map;
}

export function rankBiggestCatch(catches) {
  const userMap = buildUserMap(catches);
  const best = {};
  catches.forEach((c) => {
    const w = parseFloat(c.weight);
    if (!w) return;
    if (!best[c.userId] || w > best[c.userId].value) {
      best[c.userId] = { value: w, species: c.species };
    }
  });
  return Object.entries(best)
    .sort((a, b) => b[1].value - a[1].value)
    .slice(0, 20)
    .map(([userId, data], i) => ({
      rank: i + 1,
      userId,
      displayName: userMap[userId]?.displayName || 'Angler',
      photoURL: userMap[userId]?.photoURL,
      value: `${data.value} lbs`,
      species: data.species,
    }));
}

export function rankMostCatches(catches) {
  const userMap = buildUserMap(catches);
  const counts = {};
  catches.forEach((c) => {
    counts[c.userId] = (counts[c.userId] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([userId, count], i) => ({
      rank: i + 1,
      userId,
      displayName: userMap[userId]?.displayName || 'Angler',
      photoURL: userMap[userId]?.photoURL,
      value: `${count} catches`,
    }));
}

export function rankMostSpecies(catches) {
  const userMap = buildUserMap(catches);
  const speciesSets = {};
  catches.forEach((c) => {
    if (!c.species) return;
    if (!speciesSets[c.userId]) speciesSets[c.userId] = new Set();
    speciesSets[c.userId].add(c.species);
  });
  return Object.entries(speciesSets)
    .map(([userId, set]) => [userId, set.size])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([userId, count], i) => ({
      rank: i + 1,
      userId,
      displayName: userMap[userId]?.displayName || 'Angler',
      photoURL: userMap[userId]?.photoURL,
      value: `${count} species`,
    }));
}

export function rankLongestFish(catches) {
  const userMap = buildUserMap(catches);
  const best = {};
  catches.forEach((c) => {
    const len = parseFloat(c.length);
    if (!len) return;
    if (!best[c.userId] || len > best[c.userId].value) {
      best[c.userId] = { value: len, species: c.species };
    }
  });
  return Object.entries(best)
    .sort((a, b) => b[1].value - a[1].value)
    .slice(0, 20)
    .map(([userId, data], i) => ({
      rank: i + 1,
      userId,
      displayName: userMap[userId]?.displayName || 'Angler',
      photoURL: userMap[userId]?.photoURL,
      value: `${data.value} in`,
      species: data.species,
    }));
}
