import { useState, useRef } from 'react';
import { getApiKey, hasEnvKey, saveApiKey, resizeImage } from '../utils/gemini';
import { identifyLure } from '../utils/geminiLure';
import { createCooldown } from '../utils/rateLimit';
import { useAuth } from '../contexts/AuthContext';
import { trackAiIdentification } from '../utils/usageTracking';
import styles from './LureIdentify.module.css';

const cooldown = createCooldown();

export default function LureIdentify() {
  const { user } = useAuth();
  const [image, setImage] = useState('');
  const [apiKey, setApiKey] = useState(() => getApiKey());
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const envKeySet = hasEnvKey();

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

  function handleRemove() {
    setImage('');
    setResult(null);
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  }

  async function identify() {
    if (!image) return;
    const key = getApiKey() || apiKey;
    if (!key.trim()) {
      setShowKeyInput(true);
      setError('Please enter your Gemini API key first.');
      return;
    }

    try { cooldown.check(); } catch (e) { setError(e.message); return; }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const parsed = await identifyLure(image, key);
      setResult(parsed);
      if (parsed.type !== 'Unknown' && user) trackAiIdentification(user.uid).catch(() => {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Lure / Fly Identifier</h2>
      <p className={styles.subtext}>Upload or snap a photo to identify your lure, fly, or bait using AI.</p>

      {!envKeySet && (
        <div className={styles.keySection}>
          {apiKey && !showKeyInput ? (
            <div className={styles.keyStatus}>
              <span className={styles.keyBadge}>API key set</span>
              <button type="button" className={styles.keyToggle} onClick={() => setShowKeyInput(true)}>Change</button>
            </div>
          ) : (
            <div className={styles.keyInput}>
              <label className={styles.keyLabel}>Gemini API Key</label>
              <div className={styles.keyRow}>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => { setApiKey(e.target.value); saveApiKey(e.target.value); }}
                  placeholder="Paste your Gemini API key..."
                  className={styles.keyField}
                />
                {showKeyInput && apiKey && (
                  <button type="button" className={styles.keyDone} onClick={() => { setShowKeyInput(false); setError(''); }}>Done</button>
                )}
              </div>
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className={styles.keyHelp}>
                Get a free API key from Google AI Studio
              </a>
            </div>
          )}
        </div>
      )}

      {!image ? (
        <div className={styles.uploadArea}>
          <label className={styles.cameraBtn}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z" />
              <path d="M9 2 7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
            </svg>
            <span>Take Photo</span>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className={styles.hiddenInput} />
          </label>
          <label className={styles.uploadBtn}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M19 7v2.99s-1.99.01-2 0V7h-3s.01-1.99 0-2h3V2h2v3h3v2h-3zm-3 4V8h-3V5H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8h-3zM5 19l3-4 2 3 3-4 4 5H5z" />
            </svg>
            <span>Upload Photo</span>
            <input type="file" accept="image/*" onChange={handleFile} className={styles.hiddenInput} />
          </label>
        </div>
      ) : (
        <div className={styles.previewSection}>
          <div className={styles.previewWrap}>
            <img src={image} alt="Lure to identify" className={styles.previewImg} />
            <button type="button" className={styles.removeBtn} onClick={handleRemove} title="Remove photo">&times;</button>
          </div>
          <button type="button" className={styles.identifyBtn} onClick={identify} disabled={loading}>
            {loading ? (
              <><span className={styles.spinner} /> Analyzing...</>
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                </svg>
                Identify Lure
              </>
            )}
          </button>
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}

      {result && result.type !== 'Unknown' && (
        <div className={styles.resultCard}>
          <div className={styles.resultHeader}>
            <div>
              <h3 className={styles.lureName}>{result.name || result.type}</h3>
              <span className={styles.lureType}>{result.type}</span>
            </div>
            {result.category && <span className={styles.categoryBadge}>{result.category}</span>}
          </div>
          <div className={styles.resultBody}>
            <div className={styles.detailGrid}>
              {result.color && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Color</span>
                  <span className={styles.detailValue}>{result.color}</span>
                </div>
              )}
              {result.size && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Size</span>
                  <span className={styles.detailValue}>{result.size}</span>
                </div>
              )}
            </div>
            {result.technique && (
              <div className={styles.section}>
                <h4>Technique</h4>
                <p>{result.technique}</p>
              </div>
            )}
            {result.bestFor?.length > 0 && (
              <div className={styles.section}>
                <h4>Best For</h4>
                <div className={styles.speciesTags}>
                  {result.bestFor.map((s) => <span key={s} className={styles.speciesTag}>{s}</span>)}
                </div>
              </div>
            )}
            {result.description && (
              <div className={styles.section}>
                <h4>Description</h4>
                <p>{result.description}</p>
              </div>
            )}
            {result.tips && (
              <div className={styles.section}>
                <h4>Tips</h4>
                <p>{result.tips}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {result && result.type === 'Unknown' && (
        <div className={styles.noResult}>{result.description}</div>
      )}
    </div>
  );
}
