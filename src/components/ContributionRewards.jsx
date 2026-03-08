import { useEffect, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { MILESTONES, getCurrentMilestone, getNextMilestone } from '../config/heatmapRewards';
import { useToast } from '../contexts/ToastContext';
import styles from './ContributionRewards.module.css';

export default function ContributionRewards({ contributionPoints, earnedMilestones, userId, isOwn }) {
  const toast = useToast();
  const notifiedRef = useRef(new Set());

  const currentMilestone = getCurrentMilestone(contributionPoints);
  const nextMilestone = getNextMilestone(contributionPoints);
  const progressPercent = nextMilestone
    ? Math.round((contributionPoints / nextMilestone.points) * 100)
    : 100;

  useEffect(() => {
    if (!isOwn || !userId) return;

    async function checkNewMilestones() {
      const newMilestones = {};
      for (const milestone of MILESTONES) {
        if (
          contributionPoints >= milestone.points &&
          !earnedMilestones?.[milestone.key] &&
          !notifiedRef.current.has(milestone.key)
        ) {
          newMilestones[`earnedMilestones.${milestone.key}`] = { earnedAt: new Date().toISOString() };
          notifiedRef.current.add(milestone.key);
        }
      }

      if (Object.keys(newMilestones).length === 0) return;

      try {
        await updateDoc(doc(db, 'users', userId), newMilestones);
        for (const milestone of MILESTONES) {
          if (newMilestones[`earnedMilestones.${milestone.key}`]) {
            toast.success(`Milestone reached: ${milestone.label}!`);
          }
        }
      } catch (err) {
      }
    }

    checkNewMilestones();
  }, [contributionPoints, earnedMilestones, isOwn, userId, toast]);

  return (
    <div className={styles.container}>
      <div className={styles.pointsHeader}>
        <span className={styles.pointsLabel}>Contribution Points</span>
        <span className={styles.pointsValue}>{contributionPoints}</span>
      </div>

      {nextMilestone && (
        <div className={styles.progressWrap}>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
          <span className={styles.progressLabel}>
            {contributionPoints}/{nextMilestone.points} to {nextMilestone.label}
          </span>
        </div>
      )}

      <div className={styles.grid}>
        {MILESTONES.map((milestone) => {
          const isEarned = contributionPoints >= milestone.points || !!earnedMilestones?.[milestone.key];
          const isNew = isOwn && contributionPoints >= milestone.points && !earnedMilestones?.[milestone.key];

          return (
            <div
              key={milestone.key}
              className={`${styles.badge} ${isEarned ? styles.badgeEarned : styles.badgeLocked} ${isNew ? styles.badgeCelebrate : ''}`}
            >
              <div
                className={styles.iconWrap}
                style={{ background: isEarned ? milestone.color : '#bdbdbd' }}
              >
                <svg viewBox="0 0 24 24" width="24" height="24" fill="#fff">
                  <path d={milestone.icon} />
                </svg>
              </div>
              <span className={styles.badgeName}>{milestone.label}</span>
              <span className={styles.badgeDesc}>{milestone.points} pts</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
