import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { parseSonarFile, computeStats } from '../utils/sonarParsers';
import { saveDepthPoints } from '../utils/depthPoints';
import SonarPreviewMap from './SonarPreviewMap';
import styles from './SonarImport.module.css';

const ACCEPTED = '.csv,.gpx,.txt,.xml';

function generateBatchId() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function SonarImport() {
  const { user } = useAuth();
  const fileRef = useRef(null);

  // Step: 'upload' | 'preview' | 'saving' | 'done'
  const [step, setStep] = useState('upload');
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [points, setPoints] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [columnMapping, setColumnMapping] = useState(null);
  const [stats, setStats] = useState(null);
  const [progress, setProgress] = useState({ written: 0, total: 0 });
  const [savedCount, setSavedCount] = useState(0);

  const handleFile = useCallback((file) => {
    if (!file) return;
    setError('');
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const result = parseSonarFile(text, file.name);

      if (result.points.length === 0) {
        setError(result.warnings?.[0] || 'No depth data found in file');
        return;
      }

      setPoints(result.points);
      setWarnings(result.warnings || []);
      setColumnMapping(result.columnMapping || null);
      setStats(computeStats(result.points));
      setStep('preview');
    };
    reader.onerror = () => setError('Failed to read file');
    reader.readAsText(file);
  }, []);

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
  }

  function handleInputChange(e) {
    handleFile(e.target.files[0]);
  }

  async function handleSave() {
    if (!user) return;
    setStep('saving');
    setProgress({ written: 0, total: points.length });

    try {
      const batchId = generateBatchId();
      await saveDepthPoints(user.uid, points, batchId, (written, total) => {
        setProgress({ written, total });
      });
      setSavedCount(points.length);
      setStep('done');
    } catch (err) {
      setError(`Save failed: ${err.message}`);
      setStep('preview');
    }
  }

  function handleReset() {
    setStep('upload');
    setPoints([]);
    setWarnings([]);
    setColumnMapping(null);
    setStats(null);
    setError('');
    setFileName('');
    setProgress({ written: 0, total: 0 });
    if (fileRef.current) fileRef.current.value = '';
  }

  if (!user) {
    return (
      <div className={styles.page}>
        <h1 className={styles.heading}>Sonar Import</h1>
        <div className={styles.authGate}>
          <p>Sign in to import sonar data and build your personal depth map.</p>
          <Link to="/auth" className={styles.authLink}>Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Sonar Import</h1>
      <p className={styles.subheading}>Upload depth logs from your fish finder to build a personal bathymetric dataset.</p>

      {error && <div className={styles.errorMsg}>{error}</div>}

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <>
          <div
            className={`${styles.dropZone} ${dragging ? styles.dropZoneDragging : ''}`}
            onClick={() => fileRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <span className={styles.dropIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.5 }}>
                <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zm-6-6v4h-2v-4H8l4-4 4 4h-2z"/>
              </svg>
            </span>
            <div className={styles.dropLabel}>Drop a file or click to browse</div>
            <div className={styles.dropHint}>CSV, GPX, TXT, or XML from any fish finder</div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED}
            className={styles.hiddenInput}
            onChange={handleInputChange}
          />
        </>
      )}

      {/* Step 2: Preview */}
      {step === 'preview' && stats && (
        <>
          <div className={styles.statsCard}>
            <div className={styles.stat}>
              <div className={styles.statValue}>{stats.count.toLocaleString()}</div>
              <div className={styles.statLabel}>Points</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{stats.minDepth} ft</div>
              <div className={styles.statLabel}>Shallowest</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{stats.maxDepth} ft</div>
              <div className={styles.statLabel}>Deepest</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{stats.avgDepth} ft</div>
              <div className={styles.statLabel}>Avg Depth</div>
            </div>
            {stats.hasTemp && (
              <div className={styles.stat}>
                <div className={styles.statValue}>{stats.avgTemp}°F</div>
                <div className={styles.statLabel}>Avg Temp</div>
              </div>
            )}
          </div>

          {columnMapping && (
            <details className={styles.mappingCard}>
              <summary>Detected Columns</summary>
              <div className={styles.mappingList}>
                <span className={styles.mappingTag}>Lat: {columnMapping.lat}</span>
                <span className={styles.mappingTag}>Lng: {columnMapping.lng}</span>
                <span className={styles.mappingTag}>Depth: {columnMapping.depth}</span>
                {columnMapping.temp && <span className={styles.mappingTag}>Temp: {columnMapping.temp}</span>}
                {columnMapping.time && <span className={styles.mappingTag}>Time: {columnMapping.time}</span>}
              </div>
            </details>
          )}

          <SonarPreviewMap points={points} />

          {warnings.length > 0 && (
            <details className={styles.warnings}>
              <summary>{warnings.length} warning{warnings.length !== 1 ? 's' : ''}</summary>
              <ul className={styles.warningList}>
                {warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </details>
          )}

          <div className={styles.actions}>
            <button className={styles.secondaryBtn} onClick={handleReset}>Cancel</button>
            <button className={styles.primaryBtn} onClick={handleSave}>
              Save {stats.count.toLocaleString()} Points
            </button>
          </div>
        </>
      )}

      {/* Step 3: Saving */}
      {step === 'saving' && (
        <div className={styles.progressWrap}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress.total ? (progress.written / progress.total) * 100 : 0}%` }}
            />
          </div>
          <div className={styles.progressText}>
            Saving {progress.written.toLocaleString()} of {progress.total.toLocaleString()} points...
          </div>
        </div>
      )}

      {/* Step 4: Done */}
      {step === 'done' && (
        <div className={styles.successCard}>
          <span className={styles.successIcon}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="#43a047">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </span>
          <div className={styles.successTitle}>Import Complete</div>
          <div className={styles.successDetail}>
            {savedCount.toLocaleString()} depth points saved from {fileName}
          </div>
          <div className={styles.actions}>
            <Link to="/map" className={styles.primaryBtn} style={{ textAlign: 'center', textDecoration: 'none' }}>
              View on Map
            </Link>
            <button className={styles.secondaryBtn} onClick={handleReset}>Import Another</button>
          </div>
        </div>
      )}
    </div>
  );
}
