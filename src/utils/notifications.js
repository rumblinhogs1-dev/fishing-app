import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

const MAX_NOTIFICATIONS = 100;

async function getUserNotifPrefs(userId) {
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists() && snap.data().notificationPreferences) {
      return snap.data().notificationPreferences;
    }
  } catch (err) {
    console.error('Failed to read notification preferences:', err);
  }
  return null;
}

export async function createNotification(toUserId, notification) {
  if (!toUserId) return;
  const ref = await addDoc(collection(db, 'notifications'), {
    toUserId,
    read: false,
    createdAt: serverTimestamp(),
    ...notification,
  });

  // Trim oldest beyond limit
  const allQ = query(
    collection(db, 'notifications'),
    where('toUserId', '==', toUserId),
    orderBy('createdAt', 'desc'),
    limit(MAX_NOTIFICATIONS + 20)
  );
  const snap = await getDocs(allQ);
  if (snap.size > MAX_NOTIFICATIONS) {
    const toDelete = snap.docs.slice(MAX_NOTIFICATIONS);
    const batch = writeBatch(db);
    toDelete.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  return ref;
}

export async function notifyFriendRequest(fromUserId, fromDisplayName, toUserId) {
  const prefs = await getUserNotifPrefs(toUserId);
  if (prefs && prefs.friend_request === false) return;
  return createNotification(toUserId, {
    type: 'friend_request',
    fromUserId,
    message: `${fromDisplayName || 'Someone'} sent you a friend request`,
    link: '/friends',
  });
}

export async function notifyFriendAccepted(fromUserId, fromDisplayName, toUserId) {
  const prefs = await getUserNotifPrefs(toUserId);
  if (prefs && prefs.friend_accepted === false) return;
  return createNotification(toUserId, {
    type: 'friend_accepted',
    fromUserId,
    message: `${fromDisplayName || 'Someone'} accepted your friend request`,
    link: `/user/${fromUserId}`,
  });
}

export async function notifyCatchLiked(fromUserId, fromDisplayName, toUserId, catchId, emoji) {
  if (fromUserId === toUserId) return; // Don't notify self
  const prefs = await getUserNotifPrefs(toUserId);
  if (prefs && prefs.catch_liked === false) return;
  return createNotification(toUserId, {
    type: 'catch_liked',
    fromUserId,
    message: `${fromDisplayName || 'Someone'} reacted to your catch`,
    link: `/catch/${catchId}`,
    emoji,
  });
}

export async function notifyChallengeInvite(fromUserId, fromDisplayName, toUserId, challengeId, challengeDetails = {}) {
  const prefs = await getUserNotifPrefs(toUserId);
  if (prefs && prefs.challenge_invite === false) return;
  const { name, type, description } = challengeDetails;
  const desc = description ? ` — ${description.slice(0, 80)}` : '';
  const typeName = type ? ` (${type.replace(/_/g, ' ')})` : '';
  const msg = name
    ? `${fromDisplayName || 'Someone'} invited you to "${name}"${typeName}${desc}`
    : `${fromDisplayName || 'Someone'} challenged you!`;
  return createNotification(toUserId, {
    type: 'challenge_invite',
    fromUserId,
    message: msg,
    link: `/challenge/${challengeId}`,
  });
}

export async function notifyFriendCatch(fromUserId, fromDisplayName, catchId, species) {
  const userSnap = await getDoc(doc(db, 'users', fromUserId));
  const friendIds = userSnap.exists() ? userSnap.data().friendIds || [] : [];
  const label = species || 'a fish';
  await Promise.all(
    friendIds.map(async (friendId) => {
      const prefs = await getUserNotifPrefs(friendId);
      if (prefs && prefs.friend_catch === false) return;
      return createNotification(friendId, {
        type: 'friend_catch',
        fromUserId,
        message: `${fromDisplayName || 'Someone'} caught ${label}!`,
        link: `/catch/${catchId}`,
      });
    })
  );
}

export async function notifyChatMessage(fromUserId, fromDisplayName, groupId, groupName, text, memberIds) {
  const preview = text ? (text.length > 80 ? text.slice(0, 80) + '...' : text) : '[Photo]';
  await Promise.all(
    memberIds
      .filter((id) => id !== fromUserId)
      .map(async (memberId) => {
        const prefs = await getUserNotifPrefs(memberId);
        if (prefs && prefs.chat_message === false) return;
        return createNotification(memberId, {
          type: 'chat_message',
          fromUserId,
          message: `${fromDisplayName || 'Someone'}: ${preview}`,
          link: `/chat/${groupId}`,
        });
      })
  );
}

export async function notifyTripInvite(fromUserId, fromDisplayName, toUserId, tripName) {
  const prefs = await getUserNotifPrefs(toUserId);
  if (prefs && prefs.trip_invite === false) return;
  return createNotification(toUserId, {
    type: 'trip_invite',
    fromUserId,
    message: `${fromDisplayName || 'Someone'} invited you to a trip: ${tripName}`,
    link: '/trips',
  });
}

export async function notifyChallengeResult(toUserId, challengeId, resultMessage) {
  const prefs = await getUserNotifPrefs(toUserId);
  if (prefs && prefs.challenge_result === false) return;
  return createNotification(toUserId, {
    type: 'challenge_result',
    message: resultMessage,
    link: `/challenge/${challengeId}`,
  });
}

export function subscribeToNotifications(userId, callback) {
  const q = query(
    collection(db, 'notifications'),
    where('toUserId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  return onSnapshot(q, (snapshot) => {
    callback(
      snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.()?.toISOString() || null,
      }))
    );
  }, (error) => {
    console.error('Firestore subscription error:', error);
    callback([]);
  });
}

export async function markNotificationRead(notificationId) {
  await updateDoc(doc(db, 'notifications', notificationId), { read: true });
}

export async function markAllNotificationsRead(userId) {
  const q = query(
    collection(db, 'notifications'),
    where('toUserId', '==', userId),
    where('read', '==', false)
  );
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
  await batch.commit();
}

export function getUnreadCount(notifications) {
  return notifications.filter((n) => !n.read).length;
}
