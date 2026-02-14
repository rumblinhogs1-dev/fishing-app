import { useEffect, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { BADGES, evaluateBadges } from '../utils/conservation';
import { useToast } from '../contexts/ToastContext';
import styles from './ConservationBadges.module.css';

export default function ConservationBadges({ catches, earnedBadges, userId, isOwn }) {
  const toast = useToast();
  const notifiedRef = useRef(new Set());

  const badgeStatus = evaluateBadges(catches || []);

  useEffect(() => {
    if (!isOwn || !userId) return;

    async function checkNewBadges() {
      const newBadges = {};
      for (const badge of BADGES) {
        const status = badgeStatus[badge.id];
        if (status?.earned && !earnedBadges?.[badge.id] && !notifiedRef.current.has(badge.id)) {
          newBadges[`earnedBadges.${badge.id}`] = { earnedAt: new Date().toISOString() };
          notifiedRef.current.add(badge.id);
        }
      }

      if (Object.keys(newBadges).length === 0) return;

      try {
        await updateDoc(doc(db, 'users', userId), newBadges);
        for (const badge of BADGES) {
          if (newBadges[`earnedBadges.${badge.id}`]) {
            toast.success(`Badge earned: ${badge.name}!`);
          }
        }
      } catch (err) {
        console.error('Failed to save badges:', err);
      }
    }

    checkNewBadges();
  }, [badgeStatus, earnedBadges, isOwn, userId, toast]);

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Conservation Badges</h3>
      <div className={styles.grid}>
        {BADGES.map((badge) => {
          const status = badgeStatus[badge.id];
          const isEarned = status?.earned || !!earnedBadges?.[badge.id];
          const earnedDate = earnedBadges?.[badge.id]?.earnedAt;
          const isNew = isOwn && status?.earned && !earnedBadges?.[badge.id];

          return (
            <div
              key={badge.id}
              className={`${styles.badge} ${isEarned ? styles.badgeEarned : styles.badgeLocked} ${isNew ? styles.badgeCelebrate : ''}`}
            >
              <div
                className={styles.iconWrap}
                style={{ background: isEarned ? badge.color : '#bdbdbd' }}
              >
                <svg viewBox="0 0 24 24" width="28" height="28" fill="#fff">
                  <path d={badge.icon} />
                </svg>
              </div>
              <span className={styles.badgeName}>{badge.name}</span>
              <span className={styles.badgeDesc}>{badge.description}</span>
              {isEarned && earnedDate && (
                <span className={styles.earnedDate}>
                  {new Date(earnedDate).toLocaleDateString()}
                </span>
              )}
              {!isEarned && status && (
                <div className={styles.progressWrap}>
                  <div className={styles.progressTrack}>
                    <div
                      className={styles.progressFill}
                      style={{
                        width: `${Math.round((status.progress / status.target) * 100)}%`,
                        background: badge.color,
                      }}
                    />
                  </div>
                  <span className={styles.progressLabel}>
                    {status.progress}/{status.target}
                    {status.phase === 'rate' ? '%' : status.phase === 'seasons' ? ' seasons' : ''}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
