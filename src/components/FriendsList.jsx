import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFriends } from '../hooks/useFriends';
import { searchUsers, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend } from '../utils/friends';
import { findOrCreateDM } from '../utils/chat';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import styles from './FriendsList.module.css';

function timeAgo(dateVal) {
  if (!dateVal) return '';
  const date = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Active now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function FriendsList() {
  const { user } = useAuth();
  const { requests, friendProfiles, loading } = useFriends();
  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await searchUsers(searchQuery);
      setSearchResults(results.filter((u) => u.id !== user.uid));
    } catch (err) {
    } finally {
      setSearching(false);
    }
  }

  async function handleAccept(req) {
    await acceptFriendRequest(req.id, req.fromUserId, req.toUserId);
    toast.info('Request accepted');
  }

  async function handleReject(req) {
    await rejectFriendRequest(req.id);
  }

  async function handleRemove(friendId) {
    if (await confirm('Remove this friend?')) {
      await removeFriend(user.uid, friendId);
      toast.info('Friend removed');
    }
  }

  async function handleStartDM(friend) {
    try {
      const dmId = await findOrCreateDM(
        user.uid, friend.id,
        user.displayName || 'Angler',
        friend.displayName || 'Angler'
      );
      navigate(`/chat/${dmId}`);
    } catch (err) {
    }
  }

  async function handleSendRequest(toUserId) {
    try {
      await sendFriendRequest(user.uid, toUserId);
      toast.success('Friend request sent');
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (!user) {
    return (
      <div className={styles.container}>
        <p className={styles.empty}>Please <Link to="/auth">sign in</Link> to manage friends.</p>
      </div>
    );
  }

  if (loading) return <p className={styles.loading}>Loading...</p>;

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Friends</h2>

      {/* Search */}
      <form onSubmit={handleSearch} className={styles.searchRow}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search users by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button type="submit" className={styles.searchBtn} disabled={searching}>
          {searching ? 'Searching...' : 'Search'}
        </button>
      </form>

      {searchResults.length > 0 && (
        <div className={styles.section}>
          <h3>Search Results</h3>
          <div className={styles.list}>
            {searchResults.map((u) => (
              <div key={u.id} className={styles.userRow}>
                {u.photoURL ? (
                  <img src={u.photoURL} alt="" className={styles.userAvatar} referrerPolicy="no-referrer" />
                ) : (
                  <span className={styles.userInitial}>{(u.displayName || '?')[0].toUpperCase()}</span>
                )}
                <div className={styles.userInfo}>
                  <Link to={`/user/${u.id}`} className={styles.userName}>{u.displayName || u.email}</Link>
                  {u.region && <span className={styles.userSub}>{u.region}</span>}
                </div>
                <button className={styles.addBtn} onClick={() => handleSendRequest(u.id)}>Add</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Requests */}
      {requests.length > 0 && (
        <div className={styles.section}>
          <h3>Pending Requests ({requests.length})</h3>
          <div className={styles.list}>
            {requests.map((req) => (
              <div key={req.id} className={styles.userRow}>
                {req.fromPhotoURL ? (
                  <img src={req.fromPhotoURL} alt="" className={styles.userAvatar} referrerPolicy="no-referrer" />
                ) : (
                  <span className={styles.userInitial}>
                    {(req.fromDisplayName || '?')[0].toUpperCase()}
                  </span>
                )}
                <div className={styles.userInfo}>
                  <Link to={`/user/${req.fromUserId}`} className={styles.userName}>
                    {req.fromDisplayName || `User ${req.fromUserId.slice(0, 8)}...`}
                  </Link>
                </div>
                <div className={styles.requestActions}>
                  <button className={styles.acceptBtn} onClick={() => handleAccept(req)}>Accept</button>
                  <button className={styles.rejectBtn} onClick={() => handleReject(req)}>Decline</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div className={styles.section}>
        <h3>My Friends ({friendProfiles.length})</h3>
        {friendProfiles.length === 0 ? (
          <p className={styles.emptySection}>No friends yet. Search for users above!</p>
        ) : (
          <div className={styles.list}>
            {friendProfiles.map((f) => (
              <div key={f.id} className={styles.userRow}>
                {f.photoURL ? (
                  <img src={f.photoURL} alt="" className={styles.userAvatar} referrerPolicy="no-referrer" />
                ) : (
                  <span className={styles.userInitial}>{(f.displayName || '?')[0].toUpperCase()}</span>
                )}
                <div className={styles.userInfo}>
                  <Link to={`/user/${f.id}`} className={styles.userName}>{f.displayName || 'Angler'}</Link>
                  <span className={styles.userSub}>{timeAgo(f.lastActive)}</span>
                </div>
                <button className={styles.chatBtn} onClick={() => handleStartDM(f)} title="Message">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
                </button>
                <button className={styles.removeBtn} onClick={() => handleRemove(f.id)}>Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
