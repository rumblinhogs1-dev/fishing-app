import { useState, useEffect } from 'react';
import { subscribeToFriendRequests, getUserProfile } from '../utils/friends';
import { useAuth } from '../contexts/AuthContext';

export function useFriends() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [friendProfiles, setFriendProfiles] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRequests([]);
      setFriendProfiles([]);
      setUserProfile(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      const profile = await getUserProfile(user.uid);
      if (cancelled) return;
      setUserProfile(profile);

      if (profile?.friendIds?.length) {
        const profiles = await Promise.all(
          profile.friendIds.map((id) => getUserProfile(id).catch(() => null))
        );
        if (!cancelled) {
          setFriendProfiles(profiles.filter(Boolean));
        }
      }
      setLoading(false);
    }

    loadProfile();

    const unsub = subscribeToFriendRequests(user.uid, (reqs) => {
      if (!cancelled) setRequests(reqs);
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [user]);

  return { requests, friendProfiles, userProfile, loading };
}
