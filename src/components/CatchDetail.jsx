import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useSpots } from '../hooks/useSpots';
import CommentsSection from './CommentsSection';
import ReactionsBar from './ReactionsBar';
import RegulationBadge from './RegulationBadge';
import SaveSpotModal from './SaveSpotModal';
import ShareCardModal from './ShareCardModal';
import ReportModal from './ReportModal';
import { SkeletonCard } from './Skeleton';
import { useToast } from '../contexts/ToastContext';
import { submitReport } from '../utils/reports';
import styles from './CatchDetail.module.css';

export default function CatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addSpot } = useSpots();
  const toast = useToast();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSpotModal, setShowSpotModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [publicFields, setPublicFields] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const isMobile = () => window.matchMedia('(max-width: 600px)').matches;
    const removeFloating = () => {
      const existing = el.querySelector(`.${styles.mobileTooltip}`);
      if (existing) existing.remove();
    };
    const handler = (e) => {
      const tip = e.target.closest('[data-tooltip]');
      el.querySelectorAll('.tooltipActive').forEach((t) => t.classList.remove('tooltipActive'));
      removeFloating();
      if (tip) {
        if (isMobile()) {
          const rect = tip.getBoundingClientRect();
          const div = document.createElement('div');
          div.className = styles.mobileTooltip;
          div.textContent = tip.getAttribute('data-tooltip');
          div.style.top = `${rect.bottom + 8}px`;
          el.appendChild(div);
          tip.classList.add('tooltipActive');
        } else {
          const wasActive = tip.dataset.wasActive === 'true';
          tip.dataset.wasActive = wasActive ? 'false' : 'true';
          if (!wasActive) tip.classList.add('tooltipActive');
        }
      }
    };
    el.addEventListener('click', handler);
    return () => el.removeEventListener('click', handler);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'catches', id));
        if (snap.exists()) {
          const catchData = {
            id: snap.id,
            ...snap.data(),
            createdAt: snap.data().createdAt?.toDate?.()?.toISOString() || null,
          };
          setEntry(catchData);

          // Try to recover missing imageUrl from Firebase Storage
          if (!catchData.imageUrl && !catchData.image && catchData.userId) {
            try {
              const { getDownloadURL, ref } = await import('firebase/storage');
              const { storage } = await import('../firebase');
              const storageRef = ref(storage, `users/${catchData.userId}/catches/${id}/photo.jpg`);
              const url = await getDownloadURL(storageRef);
              if (url) {
                setEntry((prev) => ({ ...prev, imageUrl: url }));
                // Persist the fix so it doesn't need recovery again
                const { updateDoc } = await import('firebase/firestore');
                updateDoc(doc(db, 'catches', id), { imageUrl: url }).catch(() => {});
              }
            } catch {
              // No image in Storage either
            }
          }

          // Fetch author's public field preferences if viewing someone else's catch
          if (catchData.userId && catchData.userId !== user?.uid) {
            const userSnap = await getDoc(doc(db, 'users', catchData.userId));
            if (userSnap.exists() && userSnap.data().publicCatchFields) {
              setPublicFields(userSnap.data().publicCatchFields);
            }
          }
        }
      } catch (err) {
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, user]);

  if (loading) return <div style={{ maxWidth: 700, margin: '2rem auto', padding: '0 1rem' }}><SkeletonCard /></div>;
  if (!entry) return <p className={styles.loading}>Catch not found.</p>;

  const d = entry.date ? new Date(entry.date) : null;
  const dateStr = d ? d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : '';
  const timeStr = d ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '';
  const img = entry.imageUrl || entry.image;
  const isOwn = !!user && entry.userId === user.uid;
  // If publicFields is null, the author hasn't set preferences — show everything
  const show = (field) => isOwn || !publicFields || publicFields[field] !== false;

  return (
    <div className={styles.container} ref={containerRef}>
      <button className={styles.backBtn} onClick={() => navigate(-1)}>&larr; Back</button>

      <div className={styles.card}>
        {entry.authorDisplayName && (
          <div className={styles.author}>
            {entry.authorPhotoURL ? (
              <img src={entry.authorPhotoURL} alt="" className={styles.authorAvatar} referrerPolicy="no-referrer" />
            ) : (
              <span className={styles.authorInitial}>
                {(entry.authorDisplayName || '?')[0].toUpperCase()}
              </span>
            )}
            <Link to={`/user/${entry.userId}`} className={styles.authorName}>
              {entry.authorDisplayName}
            </Link>
          </div>
        )}

        {img && <img src={img} alt={entry.species} className={styles.photo} />}

        <div className={styles.body}>
          <h2 className={styles.species}>{entry.species}</h2>

          <div className={styles.meta}>
            {dateStr && <span>{dateStr}</span>}
            {timeStr && <span>{timeStr}</span>}
          </div>

          <div className={styles.details}>
            {entry.weight && show('weight') && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Weight</span>
                <span className={styles.detailValue}>{entry.weight} lbs</span>
              </div>
            )}
            {entry.length && show('length') && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Length</span>
                <span className={styles.detailValue}>{entry.length} in</span>
              </div>
            )}
            {entry.location && show('location') && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Location</span>
                <span className={styles.detailValue}>{entry.location}</span>
              </div>
            )}
            {entry.weather && show('weather') && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Weather</span>
                <span className={styles.detailValue}>{entry.weather}</span>
              </div>
            )}
            {entry.waterTemp && show('waterTemp') && (
              <div className={`${styles.detailItem} ${styles.hasTooltip}`} data-tooltip="Water temp drives fish activity. Trout prefer 50-65°F, bass 65-80°F. Fish slow down outside their comfort zone and move to deeper, cooler water in heat.">
                <span className={styles.detailLabel}>Water Temp</span>
                <span className={styles.detailValue}>{entry.waterTemp}°F</span>
              </div>
            )}
            {entry.flowRate && show('weather') && (
              <div className={`${styles.detailItem} ${styles.hasTooltip}`} data-tooltip="Flow rate affects where fish hold. Higher flows push fish to sheltered areas like eddies and banks. Lower flows concentrate fish in deeper pools. Moderate, stable flows are generally best.">
                <span className={styles.detailLabel}>Flow Rate</span>
                <span className={styles.detailValue}>{entry.flowRate} ft³/s</span>
              </div>
            )}
            {entry.depth && show('depth') && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Depth</span>
                <span className={styles.detailValue}>{Math.round(entry.depth)} ft</span>
              </div>
            )}
            {entry.bait && show('bait') && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Bait / Lure</span>
                <span className={styles.detailValue}>{entry.bait}</span>
              </div>
            )}
            {entry.lureName && show('bait') && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Lure</span>
                <span className={styles.detailValue}>{entry.lureName}</span>
              </div>
            )}
            {entry.released !== undefined && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Status</span>
                <span className={styles.detailValue}>{entry.released ? 'Released' : 'Kept'}</span>
              </div>
            )}
          </div>

          {entry.lureImage && show('bait') && (
            <div className={styles.lureSection}>
              <h4 className={styles.lureSectionTitle}>Lure Used</h4>
              <img src={entry.lureImage} alt={entry.lureName || 'Lure'} className={styles.lurePhoto} />
              {entry.lureName && <p className={styles.lureName}>{entry.lureName}</p>}
            </div>
          )}

          {entry.aiSpecies && (
            <div className={styles.aiSection}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>AI Identified</span>
                <span className={styles.detailValue}>
                  {entry.aiSpecies}
                  {entry.aiConfidence != null && ` (${entry.aiConfidence}%)`}
                </span>
              </div>
              {entry.aiEstimatedAge && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Est. Age</span>
                  <span className={styles.detailValue}>{entry.aiEstimatedAge}</span>
                </div>
              )}
              {entry.correctedSpecies && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Corrected To</span>
                  <span className={styles.detailValue}>{entry.correctedSpecies}</span>
                </div>
              )}
            </div>
          )}

          {entry.notes && show('notes') && (
            <div className={styles.notes}>
              <h4>Notes</h4>
              <p>{entry.notes}</p>
            </div>
          )}

          {(entry.lat && entry.lng) && (
            <RegulationBadge lat={entry.lat} lng={entry.lng} species={entry.species} />
          )}

          {entry.lat && entry.lng && user && (
            <button className={styles.saveSpotBtn} onClick={() => setShowSpotModal(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              Save This Spot
            </button>
          )}

          <button className={styles.shareBtn} onClick={() => setShowShareModal(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
            </svg>
            Share
          </button>

          {user && !isOwn && (
            <button className={styles.reportBtn} onClick={() => setShowReportModal(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/>
              </svg>
              Report
            </button>
          )}

          <ReactionsBar catchId={id} reactionCounts={entry.reactionCounts || {}} />
          <CommentsSection catchId={id} />
        </div>
      </div>

      {showSpotModal && entry.lat && entry.lng && (
        <SaveSpotModal
          lat={entry.lat}
          lng={entry.lng}
          defaultName={entry.species ? `${entry.species} Spot` : ''}
          onSave={async (data) => { await addSpot(data); toast.success('Spot saved!'); }}
          onClose={() => setShowSpotModal(false)}
        />
      )}

      {showShareModal && (
        <ShareCardModal entry={entry} onClose={() => setShowShareModal(false)} />
      )}

      {showReportModal && (
        <ReportModal
          contentType="catch"
          contentId={id}
          onClose={() => setShowReportModal(false)}
          onSubmit={(data) => submitReport(user.uid, data)}
        />
      )}
    </div>
  );
}
