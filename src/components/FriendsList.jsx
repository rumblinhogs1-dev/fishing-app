import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFriends } from '../hooks/useFriends';
import { searchUsers, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend } from '../utils/friends';
import { useToast } from '../contexts/ToastContext';
import styles from './FriendsList.module.css';

export default function FriendsList() {
  const { user } = useAuth();
  const { requests, friendProfiles, loading } = useFriends();
  const toast = useToast();
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
      console.error('Search failed:', err);
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
    if (confirm('Remove this friend?')) {
      await removeFriend(user.uid, friendId);
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
                <span className={styles.userInitial}>?</span>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>User {req.fromUserId.slice(0, 8)}...</span>
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
                </div>
                <button className={styles.removeBtn} onClick={() => handleRemove(f.id)}>Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
