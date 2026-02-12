import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import CommentsSection from './CommentsSection';
import ReactionsBar from './ReactionsBar';
import RegulationBadge from './RegulationBadge';
import styles from './CatchDetail.module.css';

export default function CatchDetail() {
  const { id } = useParams();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'catches', id));
        if (snap.exists()) {
          setEntry({
            id: snap.id,
            ...snap.data(),
            createdAt: snap.data().createdAt?.toDate?.()?.toISOString() || null,
          });
        }
      } catch (err) {
        console.error('Failed to load catch:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <p className={styles.loading}>Loading...</p>;
  if (!entry) return <p className={styles.loading}>Catch not found.</p>;

  const d = entry.date ? new Date(entry.date) : null;
  const dateStr = d ? d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : '';
  const timeStr = d ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '';
  const img = entry.imageUrl || entry.image;

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.backLink}>&#8592; Back</Link>

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
            {entry.weight && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Weight</span>
                <span className={styles.detailValue}>{entry.weight} lbs</span>
              </div>
            )}
            {entry.length && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Length</span>
                <span className={styles.detailValue}>{entry.length} in</span>
              </div>
            )}
            {entry.location && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Location</span>
                <span className={styles.detailValue}>{entry.location}</span>
              </div>
            )}
            {entry.weather && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Weather</span>
                <span className={styles.detailValue}>{entry.weather}</span>
              </div>
            )}
            {entry.waterTemp && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Water Temp</span>
                <span className={styles.detailValue}>{entry.waterTemp}°F</span>
              </div>
            )}
            {entry.flowRate && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Flow Rate</span>
                <span className={styles.detailValue}>{entry.flowRate} ft³/s</span>
              </div>
            )}
            {entry.bait && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Bait / Lure</span>
                <span className={styles.detailValue}>{entry.bait}</span>
              </div>
            )}
            {entry.lureName && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Lure</span>
                <span className={styles.detailValue}>{entry.lureName}</span>
              </div>
            )}
          </div>

          {entry.notes && (
            <div className={styles.notes}>
              <h4>Notes</h4>
              <p>{entry.notes}</p>
            </div>
          )}

          {(entry.lat && entry.lng) && (
            <RegulationBadge lat={entry.lat} lng={entry.lng} species={entry.species} />
          )}

          <ReactionsBar catchId={id} reactionCounts={entry.reactionCounts || {}} />
          <CommentsSection catchId={id} />
        </div>
      </div>
    </div>
  );
}
