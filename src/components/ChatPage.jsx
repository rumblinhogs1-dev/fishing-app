import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGroups } from '../hooks/useChat';
import styles from './ChatPage.module.css';

export default function ChatPage() {
  const { user } = useAuth();
  const { groups, loading } = useGroups(user?.uid);

  if (!user) {
    return (
      <div className={styles.container}>
        <p className={styles.empty}>Please <Link to="/auth">sign in</Link> to use chat.</p>
      </div>
    );
  }

  if (loading) return <p className={styles.loading}>Loading chats...</p>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Chats</h2>
        <Link to="/chat/new" className={styles.newBtn}>+ New Group</Link>
      </div>

      {groups.length === 0 ? (
        <div className={styles.empty}>
          <p>No group chats yet.</p>
          <Link to="/chat/new" className={styles.createLink}>Create your first group</Link>
        </div>
      ) : (
        <div className={styles.groupList}>
          {groups.map((g) => (
            <Link key={g.id} to={`/chat/${g.id}`} className={styles.groupItem}>
              <div className={styles.groupIcon}>
                {g.name?.[0]?.toUpperCase() || '#'}
              </div>
              <div className={styles.groupInfo}>
                <span className={styles.groupName}>{g.name}</span>
                <span className={styles.groupPreview}>
                  {g.lastMessage || 'No messages yet'}
                </span>
              </div>
              <span className={styles.groupMembers}>
                {g.memberIds?.length || 0} members
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
