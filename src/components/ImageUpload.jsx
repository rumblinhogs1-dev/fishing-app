import { useRef } from 'react';
import styles from './ImageUpload.module.css';

const MAX_SIZE = 800;

function resizeImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          } else {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function ImageUpload({ image, onChange }) {
  const fileRef = useRef(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await resizeImage(file);
    onChange(dataUrl);
  }

  function handleRemove() {
    onChange('');
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className={styles.wrapper}>
      <span className={styles.label}>Photo</span>

      {image ? (
        <div className={styles.preview}>
          <img src={image} alt="Catch" className={styles.img} />
          <button type="button" className={styles.removeBtn} onClick={handleRemove} title="Remove photo">
            &times;
          </button>
        </div>
      ) : (
        <div className={styles.buttons}>
          <label className={styles.cameraBtn}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z"/>
              <path d="M9 2 7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
            </svg>
            Camera
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFile}
              className={styles.hiddenInput}
            />
          </label>

          <label className={styles.uploadBtn}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M19 7v2.99s-1.99.01-2 0V7h-3s.01-1.99 0-2h3V2h2v3h3v2h-3zm-3 4V8h-3V5H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8h-3zM5 19l3-4 2 3 3-4 4 5H5z"/>
            </svg>
            Upload
            <input
              type="file"
              accept="image/*"
              onChange={handleFile}
              className={styles.hiddenInput}
            />
          </label>
        </div>
      )}
    </div>
  );
}
