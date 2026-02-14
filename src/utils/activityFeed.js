import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';

export async function getPublicFeed(lastDoc = null, pageSize = 20) {
  let q = query(
    collection(db, 'catches'),
    where('visibility', '==', 'public'),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );
  if (lastDoc) {
    q = query(
      collection(db, 'catches'),
      where('visibility', '==', 'public'),
      orderBy('createdAt', 'desc'),
      startAfter(lastDoc),
      limit(pageSize)
    );
  }
  const snapshot = await getDocs(q);
  return {
    catches: snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() || null,
    })),
    lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
    hasMore: snapshot.docs.length === pageSize,
  };
}

export async function getFriendsFeed(friendIds, lastDoc = null, pageSize = 20) {
  if (!friendIds || friendIds.length === 0) {
    return { catches: [], lastDoc: null, hasMore: false };
  }

  // Firestore 'in' queries support max 30 items
  const ids = friendIds.slice(0, 30);
  let q = query(
    collection(db, 'catches'),
    where('userId', 'in', ids),
    where('visibility', 'in', ['public', 'friends']),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );
  if (lastDoc) {
    q = query(
      collection(db, 'catches'),
      where('userId', 'in', ids),
      where('visibility', 'in', ['public', 'friends']),
      orderBy('createdAt', 'desc'),
      startAfter(lastDoc),
      limit(pageSize)
    );
  }
  const snapshot = await getDocs(q);
  return {
    catches: snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() || null,
    })),
    lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
    hasMore: snapshot.docs.length === pageSize,
  };
}

export async function getPublicFeedFiltered(lastDoc = null, pageSize = 20, speciesFilter = '') {
  const constraints = [
    where('visibility', '==', 'public'),
  ];
  if (speciesFilter) {
    constraints.push(where('species', '==', speciesFilter));
  }
  constraints.push(orderBy('createdAt', 'desc'));
  if (lastDoc) constraints.push(startAfter(lastDoc));
  constraints.push(limit(pageSize));

  const q = query(collection(db, 'catches'), ...constraints);
  const snapshot = await getDocs(q);
  return {
    catches: snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() || null,
    })),
    lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
    hasMore: snapshot.docs.length === pageSize,
  };
}

export async function getPopularSpecies() {
  const q = query(
    collection(db, 'catches'),
    where('visibility', '==', 'public'),
    orderBy('createdAt', 'desc'),
    limit(500)
  );
  const snapshot = await getDocs(q);
  const counts = {};
  snapshot.docs.forEach((d) => {
    const sp = d.data().species;
    if (sp) counts[sp] = (counts[sp] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([species]) => species);
}
