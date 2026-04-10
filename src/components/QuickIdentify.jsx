import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getApiKey, hasEnvKey, resizeImage, identifyFish } from '../utils/gemini';
import styles from './QuickIdentify.module.css';

export default function QuickIdentify() {
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    setError('');
    try {
      const dataUrl = await resizeImage(file);
      setImage(dataUrl);
    } catch (err) {
      setError(err.message);
    }
  }

  function reset() {
    setImage('');
    setResult(null);
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  }

  async function identify() {
    const key = getApiKey();
    if (!key && !hasEnvKey()) {
      setError('No API key configured.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const parsed = await identifyFish(image, key);
      setResult(parsed);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const confidenceColor =
    result?.confidence >= 75 ? '#4caf50' : result?.confidence >= 40 ? '#ff9800' : '#d32f2f';

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="#2d6a4f">
          <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
        <span className={styles.title}>Quick Fish ID</span>
        <Link to="/identify" className={styles.fullLink}>Full page</Link>
      </div>

      {!image ? (
        <div className={styles.uploadRow}>
          <label className={styles.btn}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z" />
              <path d="M9 2 7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
            </svg>
            Camera
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className={styles.hidden} />
          </label>
          <label className={styles.btn}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M19 7v2.99s-1.99.01-2 0V7h-3s.01-1.99 0-2h3V2h2v3h3v2h-3zm-3 4V8h-3V5H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8h-3zM5 19l3-4 2 3 3-4 4 5H5z" />
            </svg>
            Upload
            <input type="file" accept="image/*" onChange={handleFile} className={styles.hidden} />
          </label>
        </div>
      ) : (
        <div className={styles.previewRow}>
          <img src={image} alt="Fish" className={styles.thumb} />
          <div className={styles.previewActions}>
            {!result && (
              <button className={styles.identifyBtn} onClick={identify} disabled={loading}>
                {loading ? <><span className={styles.spinner} /> Analyzing...</> : 'Identify'}
              </button>
            )}
            <button className={styles.resetBtn} onClick={reset}>Clear</button>
          </div>
        </div>
      )}

      {error && (
        <div className={styles.error}>
          {error}
          {error.includes('API key') && (
            <> <Link to="/identify" className={styles.errorLink}>Set up key</Link></>
          )}
        </div>
      )}

      {result && result.confidence > 0 && (
        <div className={styles.result}>
          <div className={styles.resultTop}>
            <div className={styles.resultMain}>
              <span className={styles.species}>{result.species}</span>
              {result.scientificName && <span className={styles.sciName}>{result.scientificName}</span>}
            </div>
            <span className={styles.confidence} style={{ color: confidenceColor, borderColor: confidenceColor }}>
              {result.confidence}%
            </span>
          </div>
          <div className={styles.resultDetails}>
            {result.estimatedLength && <span className={styles.detailTag}>&#8596; {result.estimatedLength}</span>}
            {result.estimatedWeight && <span className={styles.detailTag}>&#9878; {result.estimatedWeight}</span>}
            {result.weather && <span className={styles.detailTag}>&#9788; {result.weather}</span>}
            {result.location && <span className={styles.detailTag}>&#9906; {result.location}</span>}
          </div>
        </div>
      )}

      {result && result.confidence === 0 && (
        <div className={styles.noFish}>No fish detected in this image.</div>
      )}
    </div>
  );
}
