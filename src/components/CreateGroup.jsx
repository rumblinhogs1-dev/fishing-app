import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFriends } from '../hooks/useFriends';
import { createGroup } from '../utils/chat';
import styles from './CreateGroup.module.css';

export default function CreateGroup() {
  const { user } = useAuth();
  const { friendProfiles } = useFriends();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [creating, setCreating] = useState(false);

  function toggleMember(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim() || selectedIds.length === 0) return;
    setCreating(true);
    try {
      const groupId = await createGroup(name.trim(), selectedIds, user.uid);
      navigate(`/chat/${groupId}`);
    } catch (err) {
      setCreating(false);
    }
  }

  if (!user) return <p className={styles.empty}>Please sign in.</p>;

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={() => navigate(-1)}>&larr; Back</button>
      <h2 className={styles.heading}>Create Group Chat</h2>

      <form onSubmit={handleCreate} className={styles.form}>
        <label className={styles.field}>
          <span>Group Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Bass Fishing Crew"
            required
          />
        </label>

        <div className={styles.membersSection}>
          <span className={styles.membersLabel}>
            Select Friends ({selectedIds.length} selected)
          </span>
          {friendProfiles.length === 0 ? (
            <p className={styles.noFriends}>No friends yet. Add some friends first!</p>
          ) : (
            <div className={styles.membersList}>
              {friendProfiles.map((f) => (
                <label key={f.id} className={`${styles.memberItem} ${selectedIds.includes(f.id) ? styles.selected : ''}`}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(f.id)}
                    onChange={() => toggleMember(f.id)}
                    className={styles.checkbox}
                  />
                  {f.photoURL ? (
                    <img src={f.photoURL} alt="" className={styles.memberAvatar} referrerPolicy="no-referrer" />
                  ) : (
                    <span className={styles.memberInitial}>{(f.displayName || '?')[0].toUpperCase()}</span>
                  )}
                  <span className={styles.memberName}>{f.displayName || 'Angler'}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <button type="submit" className={styles.createBtn} disabled={creating || !name.trim() || selectedIds.length === 0}>
          {creating ? 'Creating...' : 'Create Group'}
        </button>
      </form>
    </div>
  );
}
