import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

export async function addComment(catchId, userId, displayName, text) {
  await addDoc(collection(db, 'comments'), {
    catchId,
    userId,
    displayName,
    text,
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
    where('catchId', '==', catchId),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() || null,
    })));
  });
}
