import { useState, useEffect } from 'react';
import { subscribeToGroups, subscribeToMessages } from '../utils/chat';

export function useGroups(userId) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setGroups([]); setLoading(false); return; }
    setLoading(true);
    const unsub = subscribeToGroups(userId, (data) => {
      setGroups(data);
      setLoading(false);
    });
    return unsub;
  }, [userId]);

  return { groups, loading };
}

export function useMessages(groupId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!groupId) { setMessages([]); setLoading(false); return; }
    setLoading(true);
    setError(null);
    const unsub = subscribeToMessages(groupId, (data, err) => {
      setMessages(data);
      setLoading(false);
      if (err) setError(err);
    });
    return unsub;
  }, [groupId]);

  return { messages, loading, error };
}
