import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UserMenu from './UserMenu';
import NotificationBell from './NotificationBell';
import styles from './Navbar.module.css';

export default function Navbar({ onSearchOpen }) {
  const { user } = useAuth();
  const [aiOpen, setAiOpen] = useState(false);
  const [stockingOpen, setStockingOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const aiRef = useRef(null);
  const stockingRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (aiRef.current && !aiRef.current.contains(e.target)) {
        setAiOpen(false);
      }
      if (stockingRef.current && !stockingRef.current.contains(e.target)) {
        setStockingOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className={styles.nav}>
      <div className={styles.brand}>
        <img src={import.meta.env.BASE_URL + 'assets/logo-icon.svg'} alt="" className={styles.icon} />
        <span className={styles.title}>CatchDaddy</span>
        <span className={styles.tagline}>AI-Powered Fishing Community</span>
      </div>

      <div className={styles.navActions}>
        <button className={styles.searchBtn} onClick={onSearchOpen} title="Search (Ctrl+K)">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
        </button>
        {user && <NotificationBell />}
        <button className={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)}>
          <span /><span /><span />
        </button>
      </div>

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
        <NavLink to="/leaderboard" className={({ isActive }) => isActive ? styles.active : ''} onClick={() => setMenuOpen(false)}>
          Ranks
        </NavLink>
        <NavLink to="/map" className={({ isActive }) => isActive ? styles.active : ''} onClick={() => setMenuOpen(false)}>
          Map
        </NavLink>
        <NavLink to="/forecast" className={({ isActive }) => isActive ? styles.active : ''} onClick={() => setMenuOpen(false)}>
          Forecast
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
              <NavLink to="/local-guide" className={styles.dropdownItem} onClick={() => { setAiOpen(false); setMenuOpen(false); }}>
                Local Guide
              </NavLink>
            </div>
          )}
        </div>
        <NavLink to="/insights" className={({ isActive }) => isActive ? styles.active : ''} onClick={() => setMenuOpen(false)}>
          Insights
        </NavLink>
        <NavLink to="/regulations" className={({ isActive }) => isActive ? styles.active : ''} onClick={() => setMenuOpen(false)}>
          Regs
        </NavLink>
        <div className={styles.dropdown} ref={stockingRef}>
          <button className={styles.dropdownTrigger} onClick={() => setStockingOpen(!stockingOpen)}>
            Stocking
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style={{ marginLeft: 4 }}>
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </button>
          {stockingOpen && (
            <div className={styles.dropdownMenu}>
              <NavLink to="/stocking/az" className={styles.dropdownItem} onClick={() => { setStockingOpen(false); setMenuOpen(false); }}>
                Arizona
              </NavLink>
              <NavLink to="/stocking/co" className={styles.dropdownItem} onClick={() => { setStockingOpen(false); setMenuOpen(false); }}>
                Colorado
              </NavLink>
              <NavLink to="/stocking/id" className={styles.dropdownItem} onClick={() => { setStockingOpen(false); setMenuOpen(false); }}>
                Idaho
              </NavLink>
              <NavLink to="/stocking/nm" className={styles.dropdownItem} onClick={() => { setStockingOpen(false); setMenuOpen(false); }}>
                New Mexico
              </NavLink>
              <NavLink to="/stocking/ut" className={styles.dropdownItem} onClick={() => { setStockingOpen(false); setMenuOpen(false); }}>
                Utah
              </NavLink>
            </div>
          )}
        </div>
        <NavLink to="/conservation" className={({ isActive }) => isActive ? styles.active : ''} onClick={() => setMenuOpen(false)}>
          Eco Guide
        </NavLink>
        {user && (
          <>
            <NavLink to="/trips" className={({ isActive }) => isActive ? styles.active : ''} onClick={() => setMenuOpen(false)}>
              Trips
            </NavLink>
            <NavLink to="/import-sonar" className={({ isActive }) => isActive ? styles.active : ''} onClick={() => setMenuOpen(false)}>
              Sonar Import
            </NavLink>
            <NavLink to="/challenges" className={({ isActive }) => isActive ? styles.active : ''} onClick={() => setMenuOpen(false)}>
              Challenges
            </NavLink>
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
