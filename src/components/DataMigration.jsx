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
        // Store data URL directly as imageUrl (same as normal catch flow)
        const imageUrl = (image && image.startsWith('data:')) ? image : '';
        const catchId = await withTimeout(addCatch(userId, { ...data, imageUrl }), 15000);
        // Try upgrading to Firebase Storage URL (optional, non-blocking)
        if (imageUrl) {
          try {
            const storageUrl = await withTimeout(uploadCatchImage(userId, catchId, image), 20000);
            const { updateCatch } = await import('../utils/firestore');
            await withTimeout(updateCatch(catchId, { imageUrl: storageUrl }), 10000);
          } catch (imgErr) {
            // Image is already saved as data URL, so this is non-critical
          }
        }
      } catch (err) {
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
