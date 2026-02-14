import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UserMenu from './UserMenu';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user } = useAuth();
  const [aiOpen, setAiOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const aiRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (aiRef.current && !aiRef.current.contains(e.target)) {
        setAiOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className={styles.nav}>
      <div className={styles.brand}>
        <img src="/fish-icon.svg" alt="" className={styles.icon} />
        <span className={styles.title}>Fishing Log</span>
      </div>

      <button className={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)}>
        <span /><span /><span />
      </button>

      <div className={`${styles.links} ${menuOpen ? styles.linksOpen : ''}`}>
        <NavLink to="/" className={({ isActive }) => isActive ? styles.active : ''} onClick={() => setMenuOpen(false)}>
          Catches
        </NavLink>
        <NavLink to="/add" className={({ isActive }) => isActive ? styles.active : ''} onClick={() => setMenuOpen(false)}>
          + Add
        </NavLink>
        <NavLink to="/feed" className={({ isActive }) => isActive ? styles.active : ''} onClick={() => setMenuOpen(false)}>
          Feed
        </NavLink>
        <NavLink to="/map" className={({ isActive }) => isActive ? styles.active : ''} onClick={() => setMenuOpen(false)}>
          Map
        </NavLink>
        <div className={styles.dropdown} ref={aiRef}>
          <button className={styles.dropdownTrigger} onClick={() => setAiOpen(!aiOpen)}>
            AI Tools
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style={{ marginLeft: 4 }}>
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </button>
          {aiOpen && (
            <div className={styles.dropdownMenu}>
              <NavLink to="/identify" className={styles.dropdownItem} onClick={() => { setAiOpen(false); setMenuOpen(false); }}>
                ID Fish
              </NavLink>
              <NavLink to="/identify-lure" className={styles.dropdownItem} onClick={() => { setAiOpen(false); setMenuOpen(false); }}>
                ID Lure
              </NavLink>
              <NavLink to="/recommendations" className={styles.dropdownItem} onClick={() => { setAiOpen(false); setMenuOpen(false); }}>
                Recommendations
              </NavLink>
            </div>
          )}
        </div>
        <NavLink to="/stats" className={({ isActive }) => isActive ? styles.active : ''} onClick={() => setMenuOpen(false)}>
          Stats
        </NavLink>
        <NavLink to="/regulations" className={({ isActive }) => isActive ? styles.active : ''} onClick={() => setMenuOpen(false)}>
          Regs
        </NavLink>
        {user && (
          <>
            <NavLink to="/friends" className={({ isActive }) => isActive ? styles.active : ''} onClick={() => setMenuOpen(false)}>
              Friends
            </NavLink>
            <NavLink to="/chat" className={({ isActive }) => isActive ? styles.active : ''} onClick={() => setMenuOpen(false)}>
              Chat
            </NavLink>
          </>
        )}
        {user ? (
          <UserMenu />
        ) : (
          <NavLink to="/auth" className={({ isActive }) => isActive ? styles.active : ''} onClick={() => setMenuOpen(false)}>
            Sign In
          </NavLink>
        )}
      </div>
    </nav>
  );
}
