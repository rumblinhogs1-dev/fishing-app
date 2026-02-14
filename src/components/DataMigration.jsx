import { useState, useRef } from 'react';
import { loadCatches, saveCatches } from '../utils/storage';
import { addCatch } from '../utils/firestore';
import { uploadCatchImage } from '../utils/firebaseStorage';
import styles from './DataMigration.module.css';

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timed out')), ms)),
  ]);
}

export default function DataMigration({ userId, onComplete }) {
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, failed: 0 });
  const cancelledRef = useRef(false);

  const localCatches = loadCatches();

  if (localCatches.length === 0) return null;

  async function handleMigrate() {
    setMigrating(true);
    cancelledRef.current = false;
    const total = localCatches.length;
    let failed = 0;
    setProgress({ done: 0, total, failed: 0 });

    for (let i = 0; i < localCatches.length; i++) {
      if (cancelledRef.current) break;
      const { id, image, createdAt, ...data } = localCatches[i];
      try {
        const catchId = await withTimeout(addCatch(userId, { ...data, imageUrl: '' }), 15000);
        if (image && image.startsWith('data:')) {
          try {
            const imageUrl = await withTimeout(uploadCatchImage(userId, catchId, image), 20000);
            const { updateCatch } = await import('../utils/firestore');
            await withTimeout(updateCatch(catchId, { imageUrl }), 10000);
          } catch (imgErr) {
            console.error('Failed to upload image for catch:', imgErr);
          }
        }
      } catch (err) {
        console.error('Failed to migrate catch:', err);
        failed++;
      }
      setProgress({ done: i + 1, total, failed });
    }

    if (!cancelledRef.current && failed < total) {
      saveCatches([]);
    }
    onComplete();
  }

  function handleSkip() {
    cancelledRef.current = true;
    onComplete();
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <h3 className={styles.heading}>Migrate Local Data</h3>
        <p className={styles.text}>
          You have <strong>{localCatches.length}</strong> catch{localCatches.length !== 1 ? 'es' : ''} saved
          locally. Would you like to upload them to your account?
        </p>

        {migrating ? (
          <div className={styles.progress}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${(progress.done / progress.total) * 100}%` }}
              />
            </div>
            <span className={styles.progressText}>
              {progress.done} / {progress.total} migrated
              {progress.failed > 0 && ` (${progress.failed} failed)`}
            </span>
            <button className={styles.skipBtn} onClick={handleSkip}>
              Skip
            </button>
          </div>
        ) : (
          <div className={styles.actions}>
            <button className={styles.migrateBtn} onClick={handleMigrate}>
              Upload to Account
            </button>
            <button className={styles.skipBtn} onClick={handleSkip}>
              Skip
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
