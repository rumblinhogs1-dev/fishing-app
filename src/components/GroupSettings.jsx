import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useFriends } from '../hooks/useFriends';
import { addMemberToGroup, removeMemberFromGroup } from '../utils/chat';
import { getUserProfile } from '../utils/friends';
import { useConfirm } from '../contexts/ConfirmContext';
import styles from './GroupSettings.module.css';

export default function GroupSettings() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const { friendProfiles } = useFriends();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, 'groups', groupId));
      if (!snap.exists()) { setLoading(false); return; }
      const data = { id: snap.id, ...snap.data() };
      setGroup(data);

      const profiles = await Promise.all(
        (data.memberIds || []).map((id) => getUserProfile(id).catch(() => null))
      );
      setMembers(profiles.filter(Boolean));
      setLoading(false);
    }
    load();
  }, [groupId]);

  const isAdmin = group?.adminIds?.includes(user?.uid);

  async function handleAddMember(friendId) {
    await addMemberToGroup(groupId, friendId);
    const profile = await getUserProfile(friendId);
    if (profile) setMembers((prev) => [...prev, profile]);
  }

  async function handleRemoveMember(memberId) {
    if (!await confirm('Remove this member?')) return;
    await removeMemberFromGroup(groupId, memberId);
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  }

  if (loading) return <p className={styles.loading}>Loading...</p>;
  if (!group) return <p className={styles.loading}>Group not found.</p>;

  const nonMembers = friendProfiles.filter(
    (f) => !group.memberIds?.includes(f.id)
  );

  return (
    <div className={styles.container}>
      <Link to={`/chat/${groupId}`} className={styles.backLink}>&#8592; Back to chat</Link>
      <h2 className={styles.heading}>{group.name}</h2>
      <p className={styles.meta}>{members.length} members</p>

      <div className={styles.section}>
        <h3>Members</h3>
        <div className={styles.list}>
          {members.map((m) => (
            <div key={m.id} className={styles.memberRow}>
              {m.photoURL ? (
                <img src={m.photoURL} alt="" className={styles.avatar} referrerPolicy="no-referrer" />
              ) : (
                <span className={styles.initial}>{(m.displayName || '?')[0].toUpperCase()}</span>
              )}
              <span className={styles.memberName}>{m.displayName || 'Angler'}</span>
              {group.adminIds?.includes(m.id) && <span className={styles.adminBadge}>Admin</span>}
              {isAdmin && m.id !== user.uid && (
                <button className={styles.removeBtn} onClick={() => handleRemoveMember(m.id)}>Remove</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {isAdmin && nonMembers.length > 0 && (
        <div className={styles.section}>
          <h3>Add Friends</h3>
          <div className={styles.list}>
            {nonMembers.map((f) => (
              <div key={f.id} className={styles.memberRow}>
                {f.photoURL ? (
                  <img src={f.photoURL} alt="" className={styles.avatar} referrerPolicy="no-referrer" />
                ) : (
                  <span className={styles.initial}>{(f.displayName || '?')[0].toUpperCase()}</span>
                )}
                <span className={styles.memberName}>{f.displayName || 'Angler'}</span>
                <button className={styles.addBtn} onClick={() => handleAddMember(f.id)}>Add</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
