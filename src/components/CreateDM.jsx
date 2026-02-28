import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFriends } from '../hooks/useFriends';
import { findOrCreateDM } from '../utils/chat';
import styles from './CreateDM.module.css';

export default function CreateDM() {
  const { user } = useAuth();
  const { friendProfiles } = useFriends();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  async function handleSelect(friend) {
    if (creating) return;
    setCreating(true);
    try {
      const dmId = await findOrCreateDM(
        user.uid, friend.id,
        user.displayName || 'Angler',
        friend.displayName || 'Angler'
      );
      navigate(`/chat/${dmId}`);
    } catch (err) {
      setCreating(false);
    }
  }

  if (!user) return <p className={styles.empty}>Please sign in.</p>;

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={() => navigate(-1)}>&larr; Back</button>
      <h2 className={styles.heading}>New Message</h2>

      {friendProfiles.length === 0 ? (
        <p className={styles.noFriends}>No friends yet. Add some friends first!</p>
      ) : (
        <div className={styles.friendList}>
          {friendProfiles.map((f) => (
            <button
              key={f.id}
              className={styles.friendItem}
              onClick={() => handleSelect(f)}
              disabled={creating}
            >
              {f.photoURL ? (
                <img src={f.photoURL} alt="" className={styles.friendAvatar} referrerPolicy="no-referrer" />
              ) : (
                <span className={styles.friendInitial}>{(f.displayName || '?')[0].toUpperCase()}</span>
              )}
              <span className={styles.friendName}>{f.displayName || 'Angler'}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
