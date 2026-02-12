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
