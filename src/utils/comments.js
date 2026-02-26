import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  updateDoc,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { validateComment } from './validate';

export async function addComment(catchId, userId, displayName, text) {
  const cleanText = validateComment(text);
  if (!cleanText) throw new Error('Comment cannot be empty');
  await addDoc(collection(db, 'comments'), {
    catchId,
    userId,
    displayName,
    text: cleanText,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'catches', catchId), {
    commentCount: increment(1),
  });
}

export async function deleteComment(commentId, catchId) {
  await deleteDoc(doc(db, 'comments', commentId));
  await updateDoc(doc(db, 'catches', catchId), {
    commentCount: increment(-1),
  });
}

export function subscribeToComments(catchId, callback) {
  const q = query(
    collection(db, 'comments'),
    where('catchId', '==', catchId)
  );
  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() || null,
    }));
    comments.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
    callback(comments);
  }, (error) => {
    console.error('Firestore subscription error:', error);
    callback([]);
  });
}
