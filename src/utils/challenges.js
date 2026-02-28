import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  arrayRemove,
  increment,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  rankBiggestCatch,
  rankMostCatches,
  rankMostSpecies,
  rankLongestFish,
} from './leaderboard';
import { notifyChallengeInvite, notifyChallengeResult, notifyChallengeJoined } from './notifications';

export async function createChallenge(userId, data) {
  const now = new Date();
  const startDate = new Date(data.startDate);
  let status = 'upcoming';
  if (startDate <= now) {
    const endDate = new Date(data.endDate);
    status = endDate <= now ? 'completed' : 'active';
  }

  const creator = {
    userId,
    displayName: data.creatorDisplayName || 'Angler',
    photoURL: data.creatorPhotoURL || null,
    joinedAt: Timestamp.now(),
  };

  const ref = await addDoc(collection(db, 'challenges'), {
    name: data.name,
    description: data.description || '',
    createdBy: userId,
    creatorDisplayName: data.creatorDisplayName || 'Angler',
    creatorPhotoURL: data.creatorPhotoURL || null,
    type: data.type,
    targetSpecies: data.targetSpecies || null,
    startDate: Timestamp.fromDate(new Date(data.startDate)),
    endDate: Timestamp.fromDate(new Date(data.endDate)),
    status,
    visibility: data.visibility || 'public',
    participants: [creator],
    participantIds: [userId],
    participantCount: 1,
    invited: data.invited || [],
    results: null,
    winnerId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Fire-and-forget invite notifications
  if (data.invited?.length) {
    const details = { name: data.name, type: data.type, description: data.description };
    Promise.all(
      data.invited.map((inv) =>
        notifyChallengeInvite(userId, data.creatorDisplayName, inv.userId, ref.id, details)
      )
    ).catch(() => {});
  }

  return ref.id;
}

export async function joinChallenge(challengeId, userId, profile) {
  const participant = {
    userId,
    displayName: profile.displayName || 'Angler',
    photoURL: profile.photoURL || null,
    joinedAt: Timestamp.now(),
  };
  await updateDoc(doc(db, 'challenges', challengeId), {
    participants: arrayUnion(participant),
    participantIds: arrayUnion(userId),
    participantCount: increment(1),
    updatedAt: serverTimestamp(),
  });
  // Fire-and-forget notification to challenge creator
  getChallenge(challengeId).then((c) => {
    if (c) return notifyChallengeJoined(userId, profile.displayName, c.createdBy, challengeId, c.name);
  }).catch(() => {});
}

export async function leaveChallenge(challengeId, userId, participants) {
  const existing = participants.find((p) => p.userId === userId);
  if (!existing) return;
  await updateDoc(doc(db, 'challenges', challengeId), {
    participants: arrayRemove(existing),
    participantIds: arrayRemove(userId),
    participantCount: increment(-1),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteChallenge(challengeId) {
  await deleteDoc(doc(db, 'challenges', challengeId));
}

export async function getChallenge(challengeId) {
  const snap = await getDoc(doc(db, 'challenges', challengeId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export function subscribeToPublicChallenges(callback) {
  const q = query(
    collection(db, 'challenges'),
    where('visibility', '==', 'public'),
    orderBy('startDate', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, (error) => {
    callback([]);
  });
}

export function subscribeToChallenges(userId, callback) {
  // Three queries: public + user-created + user-joined
  const publicQ = query(
    collection(db, 'challenges'),
    where('visibility', '==', 'public'),
    orderBy('startDate', 'desc')
  );
  const ownQ = query(
    collection(db, 'challenges'),
    where('createdBy', '==', userId),
    orderBy('startDate', 'desc')
  );
  const joinedQ = query(
    collection(db, 'challenges'),
    where('participantIds', 'array-contains', userId)
  );

  let publicResults = [];
  let ownResults = [];
  let joinedResults = [];
  let ready = { public: false, own: false, joined: false };

  function allReady() {
    return ready.public && ready.own && ready.joined;
  }

  function merge() {
    const map = new Map();
    publicResults.forEach((c) => map.set(c.id, c));
    ownResults.forEach((c) => map.set(c.id, c));
    joinedResults.forEach((c) => map.set(c.id, c));
    const merged = Array.from(map.values());
    merged.sort((a, b) => {
      const aTime = a.startDate?.seconds || 0;
      const bTime = b.startDate?.seconds || 0;
      return bTime - aTime;
    });
    callback(merged);
  }

  const unsubPublic = onSnapshot(publicQ, (snap) => {
    publicResults = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    ready.public = true;
    if (allReady()) merge();
  }, (error) => {
    publicResults = [];
    ready.public = true;
    if (allReady()) merge();
  });

  const unsubOwn = onSnapshot(ownQ, (snap) => {
    ownResults = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    ready.own = true;
    if (allReady()) merge();
  }, (error) => {
    ownResults = [];
    ready.own = true;
    if (allReady()) merge();
  });

  const unsubJoined = onSnapshot(joinedQ, (snap) => {
    joinedResults = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    ready.joined = true;
    if (allReady()) merge();
  }, (error) => {
    joinedResults = [];
    ready.joined = true;
    if (allReady()) merge();
  });

  return () => {
    unsubPublic();
    unsubOwn();
    unsubJoined();
  };
}

export async function getChallengeParticipantCatches(participantIds, startDate, endDate, targetSpecies) {
  if (!participantIds?.length) return [];

  const start = startDate instanceof Timestamp ? startDate : Timestamp.fromDate(new Date(startDate));
  const end = endDate instanceof Timestamp ? endDate : Timestamp.fromDate(new Date(endDate));

  // Batch queries in groups of 30 (Firestore limit)
  const batches = [];
  for (let i = 0; i < participantIds.length; i += 30) {
    batches.push(participantIds.slice(i, i + 30));
  }

  const allCatches = [];
  for (const batch of batches) {
    const q = query(
      collection(db, 'catches'),
      where('userId', 'in', batch),
      where('createdAt', '>=', start),
      where('createdAt', '<=', end),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    snap.docs.forEach((d) => allCatches.push({ id: d.id, ...d.data() }));
  }

  if (targetSpecies) {
    const species = targetSpecies.toLowerCase();
    return allCatches.filter((c) => c.species?.toLowerCase() === species);
  }

  return allCatches;
}

export function rankTotalWeight(catches) {
  const userMap = {};
  const totals = {};

  catches.forEach((c) => {
    if (!userMap[c.userId]) {
      userMap[c.userId] = {
        displayName: c.authorDisplayName || 'Angler',
        photoURL: c.authorPhotoURL || null,
      };
    }
    const w = parseFloat(c.weight);
    if (w) {
      totals[c.userId] = (totals[c.userId] || 0) + w;
    }
  });

  return Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .map(([userId, total], i) => ({
      rank: i + 1,
      userId,
      displayName: userMap[userId]?.displayName || 'Angler',
      photoURL: userMap[userId]?.photoURL,
      value: `${Math.round(total * 100) / 100} lbs`,
    }));
}

const RANK_FNS = {
  most_catches: rankMostCatches,
  biggest_catch: rankBiggestCatch,
  most_species: rankMostSpecies,
  total_weight: rankTotalWeight,
  longest_fish: rankLongestFish,
};

export async function computeChallengeLeaderboard(challenge) {
  const participantIds = challenge.participants.map((p) => p.userId);
  const catches = await getChallengeParticipantCatches(
    participantIds,
    challenge.startDate,
    challenge.endDate,
    challenge.targetSpecies
  );

  const rankFn = RANK_FNS[challenge.type];
  if (!rankFn) return [];

  const rankings = rankFn(catches);

  // Ensure all participants appear in results (even with no catches)
  const rankedIds = new Set(rankings.map((r) => r.userId));
  challenge.participants.forEach((p) => {
    if (!rankedIds.has(p.userId)) {
      rankings.push({
        rank: rankings.length + 1,
        userId: p.userId,
        displayName: p.displayName,
        photoURL: p.photoURL,
        value: challenge.type === 'most_catches' ? '0 catches'
          : challenge.type === 'most_species' ? '0 species'
          : challenge.type === 'total_weight' ? '0 lbs'
          : challenge.type === 'biggest_catch' ? '0 lbs'
          : '0 in',
      });
    }
  });

  return rankings;
}

export async function finalizeChallenge(challengeId) {
  const challenge = await getChallenge(challengeId);
  if (!challenge || challenge.status !== 'active') return;

  const results = await computeChallengeLeaderboard(challenge);
  const winnerId = results.length > 0 ? results[0].userId : null;

  await updateDoc(doc(db, 'challenges', challengeId), {
    status: 'completed',
    results,
    winnerId,
    updatedAt: serverTimestamp(),
  });

  // Notify all participants
  const challengeName = challenge.name;
  await Promise.all(
    challenge.participants.map((p) => {
      const isWinner = p.userId === winnerId;
      const msg = isWinner
        ? `You won "${challengeName}"!`
        : `"${challengeName}" has ended. Check the results!`;
      return notifyChallengeResult(p.userId, challengeId, msg);
    })
  );
}

export function refreshChallengeStatuses(challenges) {
  const now = new Date();
  const toFinalize = [];

  challenges.forEach((c) => {
    const start = c.startDate?.toDate?.() || new Date(c.startDate);
    const end = c.endDate?.toDate?.() || new Date(c.endDate);

    if (c.status === 'upcoming' && start <= now) {
      if (end <= now) {
        toFinalize.push(c.id);
      } else {
        // Transition to active (client-side only, will update on next write)
        updateDoc(doc(db, 'challenges', c.id), {
          status: 'active',
          updatedAt: serverTimestamp(),
        }).catch(() => {});
      }
    } else if (c.status === 'active' && end <= now) {
      toFinalize.push(c.id);
    }
  });

  toFinalize.forEach((id) => finalizeChallenge(id).catch(() => {}));
}
