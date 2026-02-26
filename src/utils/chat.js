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
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../firebase';
import { validateMessage } from './validate';

export async function createGroup(name, memberIds, adminId) {
  const docRef = await addDoc(collection(db, 'groups'), {
    name,
    memberIds: [...memberIds, adminId],
    adminIds: [adminId],
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
    lastMessage: cleanText.slice(0, 100),
  });
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
