import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { markNotificationRead, markAllNotificationsRead } from '../utils/notifications';
import styles from './Notifications.module.css';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const TYPE_ICONS = {
  friend_request: 'M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  friend_accepted: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
  catch_liked: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
  challenge_invite: 'M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2z',
  challenge_result: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
};

export default function Notifications() {
  const { user } = useAuth();
  const { notifications, unreadCount } = useNotifications();
  const navigate = useNavigate();

  async function handleClick(notif) {
    if (!notif.read) {
      await markNotificationRead(notif.id);
    }
    if (notif.link) {
      navigate(notif.link);
    }
  }

  async function handleMarkAllRead() {
    if (!user) return;
    await markAllNotificationsRead(user.uid);
  }

  if (!user) {
    return (
      <div className={styles.container}>
        <p className={styles.empty}>Please sign in to view notifications.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h2 className={styles.heading}>Notifications</h2>
        {unreadCount > 0 && (
          <button className={styles.markAllBtn} onClick={handleMarkAllRead}>
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className={styles.emptyState}>
          <svg viewBox="0 0 24 24" width="48" height="48" fill="#ccc">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
          </svg>
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className={styles.list}>
          {notifications.map((notif) => (
            <button
              key={notif.id}
              className={`${styles.item} ${notif.read ? '' : styles.unread}`}
              onClick={() => handleClick(notif)}
            >
              <div
                className={styles.iconWrap}
                style={{
                  background: notif.read ? '#e0e0e0' : '#e8f0fe',
                  color: notif.read ? '#888' : '#1a73e8',
                }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d={TYPE_ICONS[notif.type] || TYPE_ICONS.catch_liked} />
                </svg>
              </div>
              <div className={styles.content}>
                <span className={styles.message}>{notif.message}</span>
                <span className={styles.time}>{timeAgo(notif.createdAt)}</span>
              </div>
              {!notif.read && <span className={styles.dot} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
