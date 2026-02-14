import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToNotifications, getUnreadCount } from '../utils/notifications';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const unsub = subscribeToNotifications(user.uid, (notifs) => {
      setNotifications(notifs);
      setUnreadCount(getUnreadCount(notifs));
    });

    return () => unsub();
  }, [user]);

  return { notifications, unreadCount };
}
