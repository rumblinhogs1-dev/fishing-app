import { useState } from 'react';
import { loadCatches, saveCatches } from '../utils/storage';
import { addCatch } from '../utils/firestore';
import { uploadCatchImage } from '../utils/firebaseStorage';
import styles from './DataMigration.module.css';

export default function DataMigration({ userId, onComplete }) {
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const localCatches = loadCatches();

  if (localCatches.length === 0) return null;

  async function handleMigrate() {
    setMigrating(true);
    const total = localCatches.length;
    setProgress({ done: 0, total });

    for (let i = 0; i < localCatches.length; i++) {
      const { id, image, createdAt, ...data } = localCatches[i];
      try {
        const catchId = await addCatch(userId, { ...data, imageUrl: '' });
        if (image && image.startsWith('data:')) {
          const imageUrl = await uploadCatchImage(userId, catchId, image);
          const { updateCatch } = await import('../utils/firestore');
          await updateCatch(catchId, { imageUrl });
        }
      } catch (err) {
        console.error('Failed to migrate catch:', err);
      }
      setProgress({ done: i + 1, total });
    }

    saveCatches([]);
    onComplete();
  }

  function handleSkip() {
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
            </span>
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
