import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

function getCurrentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

async function incrementUsage(userId, field) {
  if (!userId || !db) return;

  const ref = doc(db, 'users', userId);
  const snap = await getDoc(ref);
  const data = snap.data() || {};
  const usage = data.usage || {};
  const currentPeriod = getCurrentPeriod();

  if (usage.period !== currentPeriod) {
    // New month — reset counters
    await updateDoc(ref, {
      usage: {
        period: currentPeriod,
        catchesLogged: field === 'catchesLogged' ? 1 : 0,
        aiIdentifications: field === 'aiIdentifications' ? 1 : 0,
      },
    });
  } else {
    const { increment } = await import('firebase/firestore');
    await updateDoc(ref, {
      [`usage.${field}`]: increment(1),
    });
  }
}

export async function trackCatchLogged(userId) {
  return incrementUsage(userId, 'catchesLogged');
}

export async function trackAiIdentification(userId) {
  return incrementUsage(userId, 'aiIdentifications');
}
