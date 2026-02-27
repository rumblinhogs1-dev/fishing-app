import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGroups } from '../hooks/useChat';
import { getUserProfile } from '../utils/friends';
import styles from './ChatPage.module.css';

export default function ChatPage() {
  const { user } = useAuth();
  const { groups, loading } = useGroups(user?.uid);
  const [dmPartners, setDmPartners] = useState({});

  const dms = groups.filter((g) => g.type === 'dm');
  const groupChats = groups.filter((g) => g.type !== 'dm');

  // Load DM partner profiles
  useEffect(() => {
    if (!user || dms.length === 0) return;
    const missing = dms.filter((g) => !dmPartners[g.id]);
    if (missing.length === 0) return;
    missing.forEach(async (g) => {
      const partnerId = g.memberIds?.find((id) => id !== user.uid);
      if (!partnerId) return;
      const profile = await getUserProfile(partnerId);
      setDmPartners((prev) => ({ ...prev, [g.id]: profile }));
    });
  }, [user, dms.length]);

  if (!user) {
    return (
      <div className={styles.container}>
        <p className={styles.empty}>Please <Link to="/auth">sign in</Link> to use chat.</p>
      </div>
    );
  }

  if (loading) return <p className={styles.loading}>Loading chats...</p>;

  const hasDMs = dms.length > 0;
  const hasGroups = groupChats.length > 0;
  const isEmpty = !hasDMs && !hasGroups;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Chats</h2>
        <div className={styles.headerActions}>
          <Link to="/chat/new-dm" className={styles.newBtn}>+ New Message</Link>
          <Link to="/chat/new" className={styles.newBtn}>+ New Group</Link>
        </div>
      </div>

      {isEmpty && (
        <div className={styles.empty}>
          <p>No chats yet.</p>
          <Link to="/chat/new-dm" className={styles.createLink}>Send a message to a friend</Link>
        </div>
      )}

      {hasDMs && (
        <>
          <h3 className={styles.sectionLabel}>Messages</h3>
          <div className={styles.groupList}>
            {dms.map((g) => {
              const partner = dmPartners[g.id];
              return (
                <Link key={g.id} to={`/chat/${g.id}`} className={styles.groupItem}>
                  <div className={styles.dmAvatar}>
                    {partner?.photoURL ? (
                      <img src={partner.photoURL} alt="" className={styles.dmAvatarImg} referrerPolicy="no-referrer" />
                    ) : (
                      (partner?.displayName || '?')[0].toUpperCase()
                    )}
                  </div>
                  <div className={styles.groupInfo}>
                    <span className={styles.groupName}>{partner?.displayName || 'Angler'}</span>
                    <span className={styles.groupPreview}>
                      {g.lastMessage || 'No messages yet'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {hasGroups && (
        <>
          <h3 className={styles.sectionLabel}>Groups</h3>
          <div className={styles.groupList}>
            {groupChats.map((g) => (
              <Link key={g.id} to={`/chat/${g.id}`} className={styles.groupItem}>
                <div className={styles.groupIcon}>
                  {g.name?.[0]?.toUpperCase() || '#'}
                </div>
                <div className={styles.groupInfo}>
                  <span className={styles.groupName}>
                    {g.name}
                    {g.type === 'trip' && <span className={styles.tripBadge}>Trip</span>}
                  </span>
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
        </>
      )}
    </div>
  );
}
