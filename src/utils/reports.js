import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export async function submitReport(userId, { contentType, contentId, reason, details }) {
  await addDoc(collection(db, 'reports'), {
    contentType,
    contentId,
    reason,
    details: details || '',
    reportedBy: userId,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}
