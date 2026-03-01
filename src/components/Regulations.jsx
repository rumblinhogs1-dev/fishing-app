import { useState } from 'react';
import { getAllStates } from '../data/stateRegulations';
import { lookupByState, detectStateFromGPS } from '../utils/regulations';
import { getRegulationSummary } from '../utils/geminiRegulations';
import { getApiKey } from '../utils/gemini';
import RegulationCard from './RegulationCard';
import styles from './Regulations.module.css';

export default function Regulations() {
  const [mode, setMode] = useState('gps'); // 'gps' | 'manual'
  const [stateCode, setStateCode] = useState('');
  const [stateData, setStateData] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [gpsInfo, setGpsInfo] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState('');

  const allStates = getAllStates();

  async function handleGPSDetect() {
    setGpsLoading(true);
    setGpsError('');
    setGpsInfo('');
    setStateData(null);
    setAiResult(null);

    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });
      const { latitude, longitude } = pos.coords;
      setGpsInfo(`GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);

      const code = await detectStateFromGPS(latitude, longitude);
      if (!code) {
        setGpsError('Could not determine state from GPS. Try manual selection.');
        return;
      }
      setStateCode(code);
      const data = lookupByState(code);
      setStateData(data);
    } catch (err) {
      setGpsError(err.message || 'Failed to get GPS location.');
    } finally {
      setGpsLoading(false);
    }
  }

  function handleStateSelect(e) {
    const code = e.target.value;
    setStateCode(code);
    setAiResult(null);
    setSpeciesFilter('');
    if (code) {
      setStateData(lookupByState(code));
    } else {
      setStateData(null);
    }
  }

  async function handleAISummary() {
    if (!stateData) return;
    setAiLoading(true);
    setAiError('');
    setAiResult(null);

    try {
      const result = await getRegulationSummary({
        state: stateData.state,
        species: speciesFilter || undefined,
      }, getApiKey());
      setAiResult(result);
    } catch (err) {
      setAiError(err.message);
    } finally {
      setAiLoading(false);
    }
  }

  const filteredSpecies = stateData?.species?.filter((s) => {
    if (!speciesFilter) return true;
    return s.name.toLowerCase().includes(speciesFilter.toLowerCase());
  }) || [];

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Fishing Regulations</h2>
      <p className={styles.subtitle}>Check size limits, daily bags, and seasons by state</p>

      <div className={styles.topDisclaimer}>
        <strong>Disclaimer:</strong> The information provided here is for reference only and may not reflect the most current regulations. It is your responsibility to verify all rules with your local fish and wildlife agency before fishing. CatchDaddy is not liable for any violations.
      </div>

      <div className={styles.modeToggle}>
        <button
          className={`${styles.modeBtn} ${mode === 'gps' ? styles.modeBtnActive : ''}`}
          onClick={() => setMode('gps')}
        >
          Auto-detect (GPS)
        </button>
        <button
          className={`${styles.modeBtn} ${mode === 'manual' ? styles.modeBtnActive : ''}`}
          onClick={() => setMode('manual')}
        >
          Select State
        </button>
      </div>

      {mode === 'gps' ? (
        <div className={styles.gpsSection}>
          <button className={styles.gpsBtn} onClick={handleGPSDetect} disabled={gpsLoading}>
            {gpsLoading ? (
              <><span className={styles.gpsSpinner} /> Detecting state...</>
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
                </svg>
                Detect My State
              </>
            )}
          </button>
          {gpsInfo && <span className={styles.gpsInfo}>{gpsInfo}</span>}
          {gpsError && <span className={styles.gpsError}>{gpsError}</span>}
        </div>
      ) : (
        <div className={styles.selectSection}>
          <select className={styles.stateSelect} value={stateCode} onChange={handleStateSelect}>
            <option value="">Choose a state...</option>
            {allStates.map((s) => (
              <option key={s.code} value={s.code}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      {stateData && (
        <>
          <div className={styles.stateHeader}>
            <h3 className={styles.stateName}>{stateData.state}</h3>
            <a href={stateData.url} target="_blank" rel="noopener noreferrer" className={styles.agencyLink}>
              {stateData.agency}
            </a>
          </div>

          {stateData.licenseRequired && (
            <div className={styles.licenseNote}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
              Fishing license required.{' '}
              <a href={stateData.licenseUrl} target="_blank" rel="noopener noreferrer" className={styles.licenseLink}>
                Get a license
              </a>
            </div>
          )}

          <div className={styles.filterField}>
            <input
              className={styles.filterInput}
              type="text"
              placeholder="Filter species..."
              value={speciesFilter}
              onChange={(e) => setSpeciesFilter(e.target.value)}
            />
          </div>

          {filteredSpecies.length > 0 ? (
            <div className={styles.speciesList}>
              {filteredSpecies.map((rule) => (
                <RegulationCard key={rule.name} rule={rule} />
              ))}
            </div>
          ) : (
            <p className={styles.empty}>No species match your filter.</p>
          )}

          <div className={styles.aiSection}>
            <button className={styles.aiBtn} onClick={handleAISummary} disabled={aiLoading}>
              {aiLoading ? 'Getting AI Summary...' : `Get AI Regulation Summary for ${stateData.state}`}
            </button>

            {aiError && <div className={styles.aiError}>{aiError}</div>}

            {aiResult && (
              <div className={styles.aiResult}>
                <p className={styles.aiSummary}>{aiResult.summary}</p>
                {aiResult.keyRules?.length > 0 && (
                  <ul className={styles.aiRules}>
                    {aiResult.keyRules.map((r, i) => (
                      <li key={i} className={styles.aiRuleItem} data-type={r.type}>
                        {r.rule}
                      </li>
                    ))}
                  </ul>
                )}
                {aiResult.officialSource && (
                  <a href={aiResult.officialSource} target="_blank" rel="noopener noreferrer" className={styles.aiSource}>
                    Official source
                  </a>
                )}
                {aiResult.disclaimer && (
                  <p className={styles.aiDisclaimer}>{aiResult.disclaimer}</p>
                )}
              </div>
            )}
          </div>

          <div className={styles.disclaimer}>
            Regulations change frequently. Always verify current rules with the official state wildlife agency before fishing.
          </div>
        </>
      )}

      {!stateData && !gpsLoading && (
        <p className={styles.empty}>
          {mode === 'gps' ? 'Tap the button above to detect your state.' : 'Select a state to view regulations.'}
        </p>
      )}
    </div>
  );
}
