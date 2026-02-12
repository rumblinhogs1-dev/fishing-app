import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './UserMenu.module.css';

export default function UserMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    navigate('/');
  }

  if (!user) return null;

  const initial = (user.displayName || user.email || '?')[0].toUpperCase();

  return (
    <div className={styles.container} ref={menuRef}>
      <button className={styles.trigger} onClick={() => setOpen(!open)}>
        {user.photoURL ? (
          <img src={user.photoURL} alt="" className={styles.avatar} referrerPolicy="no-referrer" />
        ) : (
          <span className={styles.initial}>{initial}</span>
        )}
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.userInfo}>
            <span className={styles.name}>{user.displayName || 'User'}</span>
            <span className={styles.email}>{user.email}</span>
          </div>
          <div className={styles.divider} />
          <button className={styles.menuItem} onClick={() => { setOpen(false); navigate('/settings'); }}>
            Settings
          </button>
          <button className={styles.menuItem} onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
