import { NavLink } from 'react-router-dom';
import styles from './Navbar.module.css';

export default function Navbar() {
  return (
    <nav className={styles.nav}>
      <div className={styles.brand}>
        <img src="/fish-icon.svg" alt="" className={styles.icon} />
        <span className={styles.title}>Fishing Log</span>
      </div>
      <div className={styles.links}>
        <NavLink to="/" className={({ isActive }) => isActive ? styles.active : ''}>
          Catches
        </NavLink>
        <NavLink to="/add" className={({ isActive }) => isActive ? styles.active : ''}>
          + Add
        </NavLink>
        <NavLink to="/identify" className={({ isActive }) => isActive ? styles.active : ''}>
          ID Fish
        </NavLink>
        <NavLink to="/stats" className={({ isActive }) => isActive ? styles.active : ''}>
          Stats
        </NavLink>
      </div>
    </nav>
  );
}
