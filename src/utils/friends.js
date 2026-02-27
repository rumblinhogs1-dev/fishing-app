import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { notifyFriendRequest, notifyFriendAccepted } from './notifications';

export async function sendFriendRequest(fromUserId, toUserId) {
  const existing = await getDocs(
    query(
      collection(db, 'friendRequests'),
      where('fromUserId', '==', fromUserId),
      where('toUserId', '==', toUserId),
      where('status', '==', 'pending')
    )
  );
  if (!existing.empty) throw new Error('Friend request already sent.');

  const fromProfile = await getUserProfile(fromUserId);
  const result = await addDoc(collection(db, 'friendRequests'), {
    fromUserId,
    toUserId,
    fromDisplayName: fromProfile?.displayName || '',
    fromPhotoURL: fromProfile?.photoURL || '',
    status: 'pending',
    createdAt: serverTimestamp(),
  });

  notifyFriendRequest(fromUserId, fromProfile?.displayName, toUserId).catch(() => {});
  return result;
}

export async function acceptFriendRequest(requestId, fromUserId, toUserId) {
  await updateDoc(doc(db, 'friendRequests', requestId), { status: 'accepted' });
  await updateDoc(doc(db, 'users', fromUserId), {
    friendIds: arrayUnion(toUserId),
    friendCount: increment(1),
  });
  await updateDoc(doc(db, 'users', toUserId), {
    friendIds: arrayUnion(fromUserId),
    friendCount: increment(1),
  });

  const toProfile = await getUserProfile(toUserId);
  notifyFriendAccepted(toUserId, toProfile?.displayName, fromUserId).catch(() => {});
}

export async function rejectFriendRequest(requestId) {
  await updateDoc(doc(db, 'friendRequests', requestId), { status: 'rejected' });
}

export async function removeFriend(userId, friendId) {
  await updateDoc(doc(db, 'users', userId), {
    friendIds: arrayRemove(friendId),
    friendCount: increment(-1),
  });
  await updateDoc(doc(db, 'users', friendId), {
    friendIds: arrayRemove(userId),
    friendCount: increment(-1),
  });
}

export async function searchUsers(queryStr) {
  if (!queryStr || queryStr.length < 2) return [];
  const prefix = queryStr.toLowerCase();

  // Search by display name
  const nameQ = query(
    collection(db, 'users'),
    where('displayNameLower', '>=', prefix),
    where('displayNameLower', '<=', prefix + '\uf8ff'),
    limit(20)
  );

  // Search by email
  const emailQ = query(
    collection(db, 'users'),
    where('emailLower', '>=', prefix),
    where('emailLower', '<=', prefix + '\uf8ff'),
    limit(20)
  );

  const [nameResult, emailResult] = await Promise.allSettled([getDocs(nameQ), getDocs(emailQ)]);

  const seen = new Set();
  const results = [];
  const nameDocs = nameResult.status === 'fulfilled' ? nameResult.value.docs : [];
  const emailDocs = emailResult.status === 'fulfilled' ? emailResult.value.docs : [];
  [...nameDocs, ...emailDocs].forEach((d) => {
    if (!seen.has(d.id)) {
      seen.add(d.id);
      results.push({ id: d.id, ...d.data() });
    }
  });
  return results;
}

export function subscribeToFriendRequests(userId, callback) {
  const q = query(
    collection(db, 'friendRequests'),
    where('toUserId', '==', userId),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, (error) => {
    console.error('Firestore subscription error:', error);
    callback([]);
  });
}

export async function getUserProfile(userId) {
  const snap = await getDoc(doc(db, 'users', userId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function ensureUserDoc(user) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const { setDoc } = await import('firebase/firestore');
    await setDoc(ref, {
      displayName: user.displayName || '',
      displayNameLower: (user.displayName || '').toLowerCase(),
      email: user.email || '',
      emailLower: (user.email || '').toLowerCase(),
      photoURL: user.photoURL || '',
      friendIds: [],
      friendCount: 0,
      catchCount: 0,
      defaultVisibility: 'public',
      bio: '',
      region: '',
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp(),
    });
  } else {
    const data = snap.data();
    const updates = { lastActive: serverTimestamp() };
    if (!data.emailLower && user.email) {
      updates.emailLower = user.email.toLowerCase();
    }
    await updateDoc(ref, updates);
  }
}

export async function updateLastActive(userId) {
  if (!userId) return;
  await updateDoc(doc(db, 'users', userId), { lastActive: serverTimestamp() });
}
