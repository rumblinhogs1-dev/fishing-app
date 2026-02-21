import { useState, useEffect } from 'react';
import { TEMPLATES, generateShareCard } from '../utils/shareCard';
import { useToast } from '../contexts/ToastContext';
import styles from './ShareCardModal.module.css';

export default function ShareCardModal({ entry, onClose }) {
  const toast = useToast();
  const [template, setTemplate] = useState('clean');
  const [preview, setPreview] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setGenerating(true);
    generateShareCard(entry, template).then((dataUrl) => {
      if (!cancelled) {
        setPreview(dataUrl);
        setGenerating(false);
      }
    }).catch(() => {
      if (!cancelled) setGenerating(false);
    });
    return () => { cancelled = true; };
  }, [entry, template]);

  async function handleDownload() {
    if (!preview) return;
    const res = await fetch(preview);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(entry.species || 'catch').replace(/\s+/g, '-').toLowerCase()}-share.png`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded!');
  }

  async function handleCopy() {
    if (!preview) return;
    try {
      const res = await fetch(preview);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      toast.success('Image copied!');
    } catch (err) {
      console.error('Copy failed:', err);
      toast.error('Failed to copy image');
    }
  }

  async function handleShare() {
    if (!preview) return;
    try {
      const res = await fetch(preview);
      const blob = await res.blob();
      const file = new File([blob], 'catch-share.png', { type: 'image/png' });
      await navigator.share({
        title: `${entry.species || 'My Catch'}`,
        text: `Check out this ${entry.species || 'catch'}!${entry.weight ? ` ${entry.weight} lbs` : ''}\n${getCatchUrl()}`,
        files: [file],
      });
    } catch (err) {
      if (err.name !== 'AbortError') console.error('Share failed:', err);
    }
  }

  async function handleSharePhoto() {
    const imgSrc = entry.imageUrl || entry.image;
    if (!imgSrc) return;
    try {
      const res = await fetch(imgSrc);
      const blob = await res.blob();
      const ext = blob.type.includes('png') ? 'png' : 'jpg';
      const file = new File([blob], `catch.${ext}`, { type: blob.type });
      await navigator.share({
        title: `${entry.species || 'My Catch'}`,
        text: `Check out this ${entry.species || 'catch'}!${entry.weight ? ` ${entry.weight} lbs` : ''}\n${getCatchUrl()}`,
        files: [file],
      });
    } catch (err) {
      if (err.name !== 'AbortError') console.error('Share photo failed:', err);
    }
  }

  function getCatchUrl() {
    return `${window.location.origin}/fishing-app/catch/${entry.id}`;
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(getCatchUrl());
      toast.success('Link copied!');
    } catch {
      toast.error('Failed to copy link');
    }
  }

  function handleEmailShare() {
    const subject = encodeURIComponent(`Check out this ${entry.species || 'catch'}!`);
    const body = encodeURIComponent(`I caught a ${entry.species || 'fish'}${entry.weight ? ` weighing ${entry.weight} lbs` : ''}!\n\n${getCatchUrl()}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  }

  function handleTextShare() {
    const body = encodeURIComponent(`Check out this ${entry.species || 'catch'}${entry.weight ? ` - ${entry.weight} lbs` : ''}! ${getCatchUrl()}`);
    window.open(`sms:?body=${body}`, '_blank');
  }

  const catchImg = entry.imageUrl || entry.image;
  const canCopy = typeof ClipboardItem !== 'undefined';
  const canShare = typeof navigator.share === 'function' && typeof navigator.canShare === 'function';

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>Share Catch</h3>

        <div className={styles.templates}>
          {Object.entries(TEMPLATES).map(([key, t]) => (
            <button
              key={key}
              className={`${styles.templateBtn} ${template === key ? styles.templateActive : ''}`}
              onClick={() => setTemplate(key)}
            >
              {t.name}
            </button>
          ))}
        </div>

        {catchImg && (
          <div className={styles.previewArea}>
            <img src={catchImg} alt={entry.species} className={styles.previewImg} />
          </div>
        )}

        <div className={styles.previewArea}>
          {generating && <p className={styles.generating}>Generating share card...</p>}
          {preview && !generating && (
            <img src={preview} alt="Share card preview" className={styles.previewImg} />
          )}
        </div>

        <div className={styles.actions}>
          <button className={styles.actionBtn} onClick={handleDownload} disabled={!preview}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
            Download
          </button>
          {canCopy && (
            <button className={styles.actionBtn} onClick={handleCopy} disabled={!preview}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
              </svg>
              Copy
            </button>
          )}
          {canShare && (
            <button className={styles.actionBtn} onClick={handleShare} disabled={!preview}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
              </svg>
              Share Card
            </button>
          )}
          {canShare && catchImg && (
            <button className={styles.actionBtn} onClick={handleSharePhoto}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
              </svg>
              Share Photo
            </button>
          )}
        </div>

        <div className={styles.actions}>
          <button className={styles.actionBtn} onClick={handleCopyLink}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
            </svg>
            Copy Link
          </button>
          <button className={styles.actionBtn} onClick={handleEmailShare}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            Email
          </button>
          <button className={styles.actionBtn} onClick={handleTextShare}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
            </svg>
            Text
          </button>
        </div>

        <button className={styles.closeBtn} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
