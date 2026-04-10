import { collection, query, orderBy, limit, getDocs, doc, updateDoc, where, startAfter, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const ADMIN_UIDS = import.meta.env.VITE_ADMIN_UIDS?.split(',') || [];

export function isAdmin(uid) {
  return ADMIN_UIDS.includes(uid);
}

export async function getReports({ status = 'pending', pageSize = 20, lastDoc = null } = {}) {
  let q = query(
    collection(db, 'reports'),
    where('status', '==', status),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );
  if (lastDoc) q = query(q, startAfter(lastDoc));
  const snap = await getDocs(q);
  return {
    reports: snap.docs.map(d => ({ id: d.id, ...d.data() })),
    lastDoc: snap.docs[snap.docs.length - 1] || null,
  };
}

export async function getModerationLog({ pageSize = 20, lastDoc = null } = {}) {
  let q = query(
    collection(db, 'moderationLog'),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );
  if (lastDoc) q = query(q, startAfter(lastDoc));
  const snap = await getDocs(q);
  return {
    entries: snap.docs.map(d => ({ id: d.id, ...d.data() })),
    lastDoc: snap.docs[snap.docs.length - 1] || null,
  };
}

export async function updateReportStatus(reportId, status, reviewedBy) {
  await updateDoc(doc(db, 'reports', reportId), {
    status,
    reviewedBy,
    reviewedAt: new Date(),
  });
}

export async function getUser(userId) {
  const snap = await getDoc(doc(db, 'users', userId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}
