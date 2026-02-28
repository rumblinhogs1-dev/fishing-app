import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { syncPendingCatches, getPendingCatches } from '../utils/offlineStorage';
import { addCatch } from '../utils/firestore';
import styles from './OfflineBanner.module.css';

export default function OfflineBanner() {
  const { user } = useAuth();
  const [online, setOnline] = useState(navigator.onLine);
  const [showSynced, setShowSynced] = useState(false);
  const [syncCount, setSyncCount] = useState(0);
  const wasOffline = useRef(false);

  useEffect(() => {
    function handleOnline() {
      setOnline(true);
      if (wasOffline.current) {
        handleSync();
      }
    }
    function handleOffline() {
      setOnline(false);
      wasOffline.current = true;
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  async function handleSync() {
    if (!user) return;
    try {
      const pending = await getPendingCatches();
      if (pending.length === 0) return;

      // Wrap addCatch to transform image→imageUrl and add author info (matching useFirestoreCatches)
      const addCatchWithImage = (userId, data) => {
        const { image, lureImage, ...rest } = data;
        if (image && image.startsWith('data:')) {
          rest.imageUrl = image;
        }
        if (lureImage && lureImage.startsWith('data:')) {
          rest.lureImage = lureImage;
        }
        rest.authorDisplayName = user.displayName || 'Angler';
        rest.authorPhotoURL = user.photoURL || null;
        return addCatch(userId, rest);
      };

      const result = await syncPendingCatches(user.uid, addCatchWithImage, []);
      if (result.synced > 0) {
        setSyncCount(result.synced);
        setShowSynced(true);
        setTimeout(() => setShowSynced(false), 4000);
      }
    } catch (err) {
    }
  }

  if (showSynced) {
    return (
      <div className={styles.syncedBanner}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
        Synced! {syncCount} catch{syncCount !== 1 ? 'es' : ''} uploaded.
      </div>
    );
  }

  if (!online) {
    return (
      <div className={styles.offlineBanner}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 .01c0-.01-6 0-6 0H6C6 .01 0 0 0 0v6l4.67 4.67L0 18v6h6l7.33-4.67L18 24h6v-6l-4.67-7.33L24 6V.01zM2 2h4l4 4H6L2 2zm10 17.17L5.83 13l2.83-2.83L14.83 16 12 19.17zM18 22h-4l-4-4h4l4 4zm4-4h-4l-7.33-4.67L18 6h4l-7.33 7.33L22 18z"/>
        </svg>
        Offline — You can still log catches and view cached data
      </div>
    );
  }

  return null;
}
