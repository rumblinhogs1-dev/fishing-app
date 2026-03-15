import { useState } from 'react';
import ImageUpload from '../ImageUpload';
import styles from './TripTabs.module.css';

export default function TripPhotos({ trip, user, photos, onLoadPhotos, onUploadPhoto, onDeletePhoto, uploadingPhoto, toast }) {
  const [image, setImage] = useState('');
  const [caption, setCaption] = useState('');
  const [lightbox, setLightbox] = useState(null);

  async function handleUpload() {
    if (!image) return;
    await onUploadPhoto(image, caption.trim());
    setImage('');
    setCaption('');
  }

  return (
    <div className={styles.tabContent}>
      {photos !== undefined ? (
        <>
          {photos.length > 0 ? (
            <div className={styles.photoGrid}>
              {photos.map((photo) => (
                <div key={photo.id} className={styles.photoTile} onClick={() => setLightbox(photo)}>
                  <img src={photo.imageUrl} alt={photo.caption || 'Trip photo'} loading="lazy" />
                  {photo.caption && <span className={styles.photoCaption}>{photo.caption}</span>}
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyText}>No photos yet. Be the first to share one!</p>
          )}

          <div className={styles.photoUploadArea}>
            <ImageUpload image={image} onChange={setImage} />
            {image && (
              <>
                <input
                  className={styles.photoCaptionInput}
                  placeholder="Caption (optional)"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                />
                <button className={styles.photoUploadBtn} onClick={handleUpload} disabled={uploadingPhoto}>
                  {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                </button>
              </>
            )}
          </div>
        </>
      ) : (
        <div className={styles.loadSection}>
          <p className={styles.emptyText}>Photos load on demand to save bandwidth.</p>
          <button className={styles.loadBtn} onClick={onLoadPhotos}>Load Photos</button>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className={styles.lightbox} onClick={() => setLightbox(null)}>
          <button className={styles.lightboxClose} onClick={() => setLightbox(null)}>&times;</button>
          <img
            className={styles.lightboxImg}
            src={lightbox.imageUrl}
            alt={lightbox.caption || 'Trip photo'}
            onClick={(e) => e.stopPropagation()}
          />
          <div className={styles.lightboxInfo} onClick={(e) => e.stopPropagation()}>
            {lightbox.caption && <span className={styles.lightboxCaption}>{lightbox.caption}</span>}
            <span className={styles.lightboxUploader}>
              {lightbox.uploadedByPhotoURL && (
                <img src={lightbox.uploadedByPhotoURL} alt="" className={styles.lightboxUploaderAvatar} referrerPolicy="no-referrer" />
              )}
              {lightbox.uploadedByName}
            </span>
            {(lightbox.uploadedByUserId === user.uid || trip.userId === user.uid) && (
              <button className={styles.lightboxDeleteBtn} onClick={() => { onDeletePhoto(lightbox); setLightbox(null); }}>
                Delete Photo
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
