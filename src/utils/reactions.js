import {
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { db } from '../firebase';

export const REACTION_EMOJIS = {
  fish: '\u{1F41F}',
  thumbsUp: '\u{1F44D}',
  fire: '\u{1F525}',
  heart: '\u{2764}\u{FE0F}',
  trophy: '\u{1F3C6}',
};

export async function toggleReaction(catchId, userId, emoji) {
  const reactionId = `${catchId}_${userId}`;
  const ref = doc(db, 'reactions', reactionId);
  const snap = await getDoc(ref);

  if (snap.exists() && snap.data().emoji === emoji) {
    // Remove reaction
    await deleteDoc(ref);
    await updateDoc(doc(db, 'catches', catchId), {
      [`reactionCounts.${emoji}`]: increment(-1),
    });
    return false;
  } else {
    const oldEmoji = snap.exists() ? snap.data().emoji : null;
    // Set new reaction
    await setDoc(ref, {
      catchId,
      userId,
      emoji,
      createdAt: new Date(),
    });
    if (oldEmoji) {
      await updateDoc(doc(db, 'catches', catchId), {
        [`reactionCounts.${oldEmoji}`]: increment(-1),
        [`reactionCounts.${emoji}`]: increment(1),
      });
    } else {
      await updateDoc(doc(db, 'catches', catchId), {
        [`reactionCounts.${emoji}`]: increment(1),
      });
    }
    return true;
  }
}

export function subscribeToReactions(catchId, callback) {
  const q = query(
    collection(db, 'reactions'),
    where('catchId', '==', catchId)
  );
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })));
  });
}
