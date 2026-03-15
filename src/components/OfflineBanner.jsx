import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { syncAllPendingOps, getPendingOpsCount } from '../utils/offlineStorage';
import { addCatch, updateCatch as fsUpdateCatch, deleteCatch as fsDeleteCatch } from '../utils/firestore';
import { addSpot as fsAddSpot, updateSpot as fsUpdateSpot, deleteSpot as fsDeleteSpot } from '../utils/spots';
import { uploadCatchImage } from '../utils/firebaseStorage';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import styles from './OfflineBanner.module.css';

export default function OfflineBanner() {
  const { user } = useAuth();
  const [online, setOnline] = useState(navigator.onLine);
  const [showSynced, setShowSynced] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncCount, setSyncCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const wasOffline = useRef(false);

  // Poll pending ops count
  useEffect(() => {
    let cancelled = false;
    const check = () => {
      getPendingOpsCount().then((count) => {
        if (!cancelled) setPendingCount(count);
      }).catch(() => {});
    };
    check();
    const interval = setInterval(check, online ? 5000 : 2000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [online]);

  // Listen for background sync messages from service worker
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const handler = (event) => {
      if (event.data?.type === 'SYNC_REQUESTED') {
        handleSync();
      }
    };
    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, [user]);

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
    if (!user || isSyncing) return;
    setIsSyncing(true);
    try {
      const createCatch = async (userId, data) => {
        const { image, lureImage, ...rest } = data;
        if (image && image.startsWith('data:')) {
          rest.imageUrl = image;
        }
        if (lureImage && lureImage.startsWith('data:')) {
          rest.lureImage = lureImage;
        }
        rest.authorDisplayName = user.displayName || 'Angler';
        rest.authorPhotoURL = user.photoURL || null;
        const catchId = await addCatch(userId, rest);
        // Upload images to Storage if possible
        try {
          if (image && image.startsWith('data:')) {
            const url = await uploadCatchImage(userId, catchId, image);
            if (url) await fsUpdateCatch(catchId, { imageUrl: url });
          }
        } catch {}
        return catchId;
      };

      const handlers = {
        createCatch,
        updateCatch: (docId, data) => {
          const { image, lureImage, ...rest } = data;
          if (image && image.startsWith('data:')) rest.imageUrl = image;
          if (lureImage && lureImage.startsWith('data:')) rest.lureImage = lureImage;
          return fsUpdateCatch(docId, rest);
        },
        deleteCatch: fsDeleteCatch,
        createSpot: fsAddSpot,
        updateSpot: fsUpdateSpot,
        deleteSpot: fsDeleteSpot,
        getServerDoc: async (collection, docId) => {
          if (!db || !docId) return null;
          const snap = await getDoc(doc(db, collection === 'catches' ? `users/${user.uid}/catches` : `users/${user.uid}/spots`, docId));
          return snap.exists() ? snap.data() : null;
        },
      };

      const result = await syncAllPendingOps(user.uid, handlers);
      if (result.synced > 0) {
        setSyncCount(result.synced);
        setShowSynced(true);
        setPendingCount(0);
        setTimeout(() => setShowSynced(false), 4000);
      }
    } catch (err) {
    } finally {
      setIsSyncing(false);
    }
  }

  if (showSynced) {
    return (
      <div className={styles.syncedBanner}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
        Synced! {syncCount} change{syncCount !== 1 ? 's' : ''} uploaded.
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className={styles.syncingBanner}>
        <svg className={styles.spinner} width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
        </svg>
        Syncing{pendingCount > 0 ? ` ${pendingCount} change${pendingCount !== 1 ? 's' : ''}` : ''}...
      </div>
    );
  }

  if (!online) {
    return (
      <div className={styles.offlineBanner}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 .01c0-.01-6 0-6 0H6C6 .01 0 0 0 0v6l4.67 4.67L0 18v6h6l7.33-4.67L18 24h6v-6l-4.67-7.33L24 6V.01zM2 2h4l4 4H6L2 2zm10 17.17L5.83 13l2.83-2.83L14.83 16 12 19.17zM18 22h-4l-4-4h4l4 4zm4-4h-4l-7.33-4.67L18 6h4l-7.33 7.33L22 18z"/>
        </svg>
        Offline{pendingCount > 0
          ? ` — ${pendingCount} change${pendingCount !== 1 ? 's' : ''} pending sync`
          : ' — viewing cached data'}
      </div>
    );
  }

  // Online with pending items (e.g., failed syncs)
  if (pendingCount > 0) {
    return (
      <div className={styles.pendingBanner} onClick={handleSync} role="button" tabIndex={0}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
        </svg>
        {pendingCount} change{pendingCount !== 1 ? 's' : ''} pending — tap to sync
      </div>
    );
  }

  return null;
}
