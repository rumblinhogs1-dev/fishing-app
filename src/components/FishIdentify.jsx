import { useState, useRef } from 'react';
import { getApiKey, hasEnvKey, saveApiKey, resizeImage, identifyFish } from '../utils/gemini';
import SpeciesInfoCard from './SpeciesInfoCard';
import styles from './FishIdentify.module.css';

export default function FishIdentify() {
  const [image, setImage] = useState('');
  const [apiKey, setApiKey] = useState(() => getApiKey());
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState('');
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

  function handleSaveKey(key) {
    setApiKey(key);
    saveApiKey(key);
  }

  async function identify() {
    if (!image) return;
    const key = getApiKey() || apiKey;
    if (!key.trim()) {
      setShowKeyInput(true);
      setError('Please enter your Gemini API key first.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setSelectedSpecies('');

    try {
      const parsed = await identifyFish(image, key);
      setResult(parsed);
      setSelectedSpecies(parsed.species || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const confidenceColor =
    result?.confidence >= 75 ? '#4caf50' : result?.confidence >= 40 ? '#ff9800' : '#d32f2f';

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Fish Identifier</h2>
      <p className={styles.subtext}>Upload or snap a photo to identify the species using AI.</p>

      {/* API Key Section — hidden when env var is set */}
      {!envKeySet && (
        <div className={styles.keySection}>
          {apiKey && !showKeyInput ? (
            <div className={styles.keyStatus}>
              <span className={styles.keyBadge}>API key set</span>
              <button type="button" className={styles.keyToggle} onClick={() => setShowKeyInput(true)}>
                Change
              </button>
            </div>
          ) : (
            <div className={styles.keyInput}>
              <label className={styles.keyLabel}>Gemini API Key</label>
              <div className={styles.keyRow}>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => handleSaveKey(e.target.value)}
                  placeholder="Paste your Gemini API key..."
                  className={styles.keyField}
                />
                {showKeyInput && apiKey && (
                  <button type="button" className={styles.keyDone} onClick={() => { setShowKeyInput(false); setError(''); }}>
                    Done
                  </button>
                )}
              </div>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.keyHelp}
              >
                Get a free API key from Google AI Studio
              </a>
            </div>
          )}
        </div>
      )}

      {/* Upload Area */}
      {!image ? (
        <div className={styles.uploadArea}>
          <label className={styles.cameraBtn}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z" />
              <path d="M9 2 7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
            </svg>
            <span>Take Photo</span>
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
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M19 7v2.99s-1.99.01-2 0V7h-3s.01-1.99 0-2h3V2h2v3h3v2h-3zm-3 4V8h-3V5H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8h-3zM5 19l3-4 2 3 3-4 4 5H5z" />
            </svg>
            <span>Upload Photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFile}
              className={styles.hiddenInput}
            />
          </label>
        </div>
      ) : (
        <div className={styles.previewSection}>
          <div className={styles.previewWrap}>
            <img src={image} alt="Fish to identify" className={styles.previewImg} />
            <button type="button" className={styles.removeBtn} onClick={handleRemove} title="Remove photo">
              &times;
            </button>
          </div>

          <button
            type="button"
            className={styles.identifyBtn}
            onClick={identify}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className={styles.spinner} />
                Analyzing...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                </svg>
                Identify Fish
              </>
            )}
          </button>
        </div>
      )}

      {/* Error */}
      {error && <div className={styles.error}>{error}</div>}

      {/* Results */}
      {result && (
        <div className={styles.resultCard}>
          <div className={styles.resultHeader}>
            <div>
              <h3 className={styles.speciesName}>{selectedSpecies || result.species}</h3>
              {result.scientificName && (
                <p className={styles.sciName}>{result.scientificName}</p>
              )}
            </div>
            <div className={styles.confidenceBadge} style={{ borderColor: confidenceColor }}>
              <span className={styles.confidenceValue} style={{ color: confidenceColor }}>
                {result.confidence}%
              </span>
              <span className={styles.confidenceLabel}>confidence</span>
            </div>
          </div>

          {/* Confidence bar */}
          {result.confidence > 0 && (
            <div className={styles.confidenceBarWrap}>
              <div className={styles.confidenceBarTrack}>
                <div
                  className={`${styles.confidenceBarFill} ${
                    result.confidence >= 80 ? styles.confidenceHigh :
                    result.confidence >= 50 ? styles.confidenceMed :
                    styles.confidenceLow
                  }`}
                  style={{ width: `${result.confidence}%` }}
                />
              </div>
              <span className={styles.confidenceBarText}>{result.confidence}% confidence</span>
            </div>
          )}

          {/* Suggestion cards when confidence < 80 */}
          {result.confidence > 0 && result.confidence < 80 && result.alternatives?.length > 0 && (
            <div className={styles.suggestionsWrap}>
              <span className={styles.suggestionsLabel}>Could also be:</span>
              <div className={styles.suggestionCards}>
                <button
                  type="button"
                  className={`${styles.suggestionCard} ${selectedSpecies === result.species ? styles.suggestionActive : ''}`}
                  onClick={() => setSelectedSpecies(result.species)}
                >
                  <span className={styles.suggestionSpecies}>{result.species}</span>
                  <span className={styles.suggestionConf}>{result.confidence}%</span>
                </button>
                {result.alternatives.map((alt, i) => (
                  <button
                    type="button"
                    key={i}
                    className={`${styles.suggestionCard} ${selectedSpecies === alt.species ? styles.suggestionActive : ''}`}
                    onClick={() => setSelectedSpecies(alt.species)}
                  >
                    <span className={styles.suggestionSpecies}>{alt.species}</span>
                    <span className={styles.suggestionConf}>{alt.confidence}%</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {result.confidence > 0 && (
            <div className={styles.resultBody}>
              {(result.estimatedLength || result.estimatedWeight || result.estimatedAge) && (
                <div className={styles.estimateRow}>
                  {result.estimatedLength && (
                    <div className={styles.estimateCard}>
                      <span className={styles.estimateIcon}>&#8596;</span>
                      <span className={styles.estimateLabel}>Est. Length</span>
                      <span className={styles.estimateValue}>{result.estimatedLength}</span>
                    </div>
                  )}
                  {result.estimatedWeight && (
                    <div className={styles.estimateCard}>
                      <span className={styles.estimateIcon}>&#9878;</span>
                      <span className={styles.estimateLabel}>Est. Weight</span>
                      <span className={styles.estimateValue}>{result.estimatedWeight}</span>
                    </div>
                  )}
                  {result.estimatedAge && (
                    <div className={styles.estimateCard}>
                      <span className={styles.estimateIcon}>&#128337;</span>
                      <span className={styles.estimateLabel}>Est. Age</span>
                      <span className={styles.estimateValue}>{result.estimatedAge}</span>
                    </div>
                  )}
                </div>
              )}

              {(result.weather || result.location) && (
                <div className={styles.contextRow}>
                  {result.weather && (
                    <div className={styles.contextItem}>
                      <span className={styles.contextIcon}>&#9788;</span>
                      <div>
                        <h4>Weather</h4>
                        <p>{result.weather}</p>
                      </div>
                    </div>
                  )}
                  {result.location && (
                    <div className={styles.contextItem}>
                      <span className={styles.contextIcon}>&#9906;</span>
                      <div>
                        <h4>Location</h4>
                        <p>{result.location}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {result.description && (
                <div className={styles.resultSection}>
                  <h4>Identifying Features</h4>
                  <p>{result.description}</p>
                </div>
              )}
              {result.habitat && (
                <div className={styles.resultSection}>
                  <h4>Habitat</h4>
                  <p>{result.habitat}</p>
                </div>
              )}
              {result.funFact && (
                <div className={styles.resultSection}>
                  <h4>Fun Fact</h4>
                  <p>{result.funFact}</p>
                </div>
              )}

              {/* Species Info Card */}
              <SpeciesInfoCard speciesName={selectedSpecies || result.species} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
