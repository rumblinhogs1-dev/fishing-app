import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDocs,
  getDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../firebase';
import { validateMessage } from './validate';
import { uploadChatImage } from './chatStorage';
import { notifyChatMessage } from './notifications';

export async function createGroup(name, memberIds, adminId, options = {}) {
  const { type = 'group', tripId = null } = options;
  const docRef = await addDoc(collection(db, 'groups'), {
    name,
    memberIds: [...memberIds, adminId],
    adminIds: [adminId],
    type,
    tripId,
    lastMessage: '',
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function sendMessage(groupId, userId, displayName, text, imageUrl = '') {
  const cleanText = validateMessage(text);
  if (!cleanText && !imageUrl) throw new Error('Message cannot be empty');
  await addDoc(collection(db, 'messages'), {
    groupId,
    userId,
    displayName,
    text: cleanText,
    imageUrl,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'groups', groupId), {
    lastMessage: cleanText ? cleanText.slice(0, 100) : (imageUrl ? '[Photo]' : ''),
  });
  // Fire-and-forget notification
  getGroupDoc(groupId).then((g) => {
    if (g) notifyChatMessage(userId, displayName, groupId, g.name, cleanText, g.memberIds);
  }).catch(() => {});
}

export async function sendMessageWithImage(groupId, userId, displayName, text, imageDataUrl) {
  const cleanText = validateMessage(text) || '';
  const msgRef = await addDoc(collection(db, 'messages'), {
    groupId,
    userId,
    displayName,
    text: cleanText,
    imageUrl: '',
    createdAt: serverTimestamp(),
  });
  const imageUrl = await uploadChatImage(groupId, msgRef.id, imageDataUrl);
  await updateDoc(doc(db, 'messages', msgRef.id), { imageUrl });
  await updateDoc(doc(db, 'groups', groupId), {
    lastMessage: cleanText ? cleanText.slice(0, 100) : '[Photo]',
  });
  // Fire-and-forget notification
  getGroupDoc(groupId).then((g) => {
    if (g) notifyChatMessage(userId, displayName, groupId, g.name, cleanText, g.memberIds);
  }).catch(() => {});
}

export function subscribeToMessages(groupId, callback) {
  const q = query(
    collection(db, 'messages'),
    where('groupId', '==', groupId),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() || null,
    })));
  }, (error) => {
    console.error('Firestore subscription error:', error);
    callback([]);
  });
}

export function subscribeToGroups(userId, callback) {
  const q = query(
    collection(db, 'groups'),
    where('memberIds', 'array-contains', userId)
  );
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, (error) => {
    console.error('Firestore subscription error:', error);
    callback([]);
  });
}

export async function addMemberToGroup(groupId, userId) {
  await updateDoc(doc(db, 'groups', groupId), {
    memberIds: arrayUnion(userId),
  });
}

export async function removeMemberFromGroup(groupId, userId) {
  await updateDoc(doc(db, 'groups', groupId), {
    memberIds: arrayRemove(userId),
  });
}

export async function getGroupDoc(groupId) {
  const snap = await getDoc(doc(db, 'groups', groupId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// --- Direct Messages ---

export async function findOrCreateDM(userId1, userId2, displayName1, displayName2) {
  // Query groups where type == 'dm' and userId1 is a member
  const q = query(
    collection(db, 'groups'),
    where('type', '==', 'dm'),
    where('memberIds', 'array-contains', userId1)
  );
  const snap = await getDocs(q);
  // Filter client-side for userId2
  const existing = snap.docs.find((d) => d.data().memberIds.includes(userId2));
  if (existing) return existing.id;

  // Create new DM group — both users are admins so either can see it
  const dmName = `${displayName1 || 'Angler'} & ${displayName2 || 'Angler'}`;
  const docRef = await addDoc(collection(db, 'groups'), {
    name: dmName,
    memberIds: [userId1, userId2],
    adminIds: [userId1, userId2],
    type: 'dm',
    tripId: null,
    lastMessage: '',
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// --- Trip Chat ---

export async function createTripChat(tripId, tripName, memberIds, adminId) {
  return createGroup(`${tripName} Chat`, memberIds, adminId, { type: 'trip', tripId });
}

export async function findTripChat(tripId) {
  const q = query(
    collection(db, 'groups'),
    where('type', '==', 'trip'),
    where('tripId', '==', tripId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}
