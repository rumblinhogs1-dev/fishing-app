import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { getOnboardingState, setOnboardingState, markStepComplete, isAllComplete } from '../utils/onboarding';
import styles from './GettingStarted.module.css';

const STEPS = [
  { key: 'profile', label: 'Set up your profile', to: '/settings' },
  { key: 'firstCatch', label: 'Log your first catch', to: '/add' },
  { key: 'fishId', label: 'Try AI Fish ID', to: '/identify' },
  { key: 'exploredMap', label: 'Explore the map', to: '/map' },
];

export default function GettingStarted({ catches }) {
  const { user } = useAuth();
  const [state, setState] = useState(() => getOnboardingState());

  const refresh = useCallback(() => {
    const s = getOnboardingState();
    setState(s);
  }, []);

  // Re-read state on window focus so it updates after navigating back
  useEffect(() => {
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [refresh]);

  // Check if first catch is done
  useEffect(() => {
    if (catches?.length > 0 && state?.steps && !state.steps.firstCatch) {
      const updated = markStepComplete('firstCatch');
      setState(updated);
    }
  }, [catches, state?.steps]);

  // Check profile completion (region or bio or photoURL set)
  useEffect(() => {
    if (!user || state?.steps?.profile) return;

    let cancelled = false;
    getDoc(doc(db, 'users', user.uid)).then((snap) => {
      if (cancelled) return;
      if (snap.exists()) {
        const data = snap.data();
        if (data.region || data.bio || data.photoURL) {
          const updated = markStepComplete('profile');
          setState(updated);
        }
      }
    }).catch(() => {});

    return () => { cancelled = true; };
  }, [user, state?.steps?.profile]);

  // Don't render if not onboarded yet, already dismissed, or all complete
  if (!state?.welcomed || state?.dismissed || isAllComplete(state)) return null;

  const steps = state.steps || {};
  const completed = Object.values(steps).filter(Boolean).length;
  const total = STEPS.length;
  const pct = Math.round((completed / total) * 100);

  function handleDismiss() {
    const updated = setOnboardingState({ dismissed: true });
    setState(updated);
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Getting Started</h3>
        <button className={styles.closeBtn} onClick={handleDismiss} title="Dismiss">
          &times;
        </button>
      </div>

      <div className={styles.progressWrap}>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${pct}%` }} />
        </div>
        <span className={styles.progressText}>{completed}/{total} complete</span>
      </div>

      <ul className={styles.list}>
        {STEPS.map((step) => {
          const done = steps[step.key];
          return (
            <li key={step.key} className={`${styles.item} ${done ? styles.itemDone : ''}`}>
              <span className={styles.check}>{done ? '✓' : ''}</span>
              <span className={styles.label}>{step.label}</span>
              {!done && (
                <Link to={step.to} className={styles.goBtn}>Go</Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
