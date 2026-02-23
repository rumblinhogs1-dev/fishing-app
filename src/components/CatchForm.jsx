import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ImageUpload from './ImageUpload';
import QuickLureId from './QuickLureId';
import RegulationBadge from './RegulationBadge';
import SpeciesInfoCard from './SpeciesInfoCard';
import { getGPSLocation, reverseGeocode, fetchWeather, fetchWaterData } from '../utils/weather';
import { identifyFish, getApiKey } from '../utils/gemini';
import { getRandomTip } from '../utils/conservationTips';
import { addPendingCatch } from '../utils/offlineStorage';
import { useToast } from '../contexts/ToastContext';
import styles from './CatchForm.module.css';

const EMPTY = {
  species: '',
  weight: '',
  length: '',
  location: '',
  lat: '',
  lng: '',
  date: new Date().toISOString().slice(0, 16),
  weather: '',
  weatherTemp: '',
  weatherWind: '',
  weatherPressure: '',
  weatherCondition: '',
  weatherCloudCover: '',
  waterTemp: '',
  flowRate: '',
  depth: '',
  waterStation: '',
  bait: '',
  lureImage: '',
  lureType: '',
  lureName: '',
  lureCategory: '',
  lureColor: '',
  released: true,
  visibility: 'public',
  notes: '',
  image: '',
};

export default function CatchForm({ existing, onSubmit }) {
  const [form, setForm] = useState(EMPTY);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [fishIdLoading, setFishIdLoading] = useState(false);
  const [fishIdResult, setFishIdResult] = useState(null);
  const [fishIdError, setFishIdError] = useState('');
  const [fishIdConfirmed, setFishIdConfirmed] = useState(null);
  const [correctedSpecies, setCorrectedSpecies] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  useEffect(() => {
    if (existing) {
      setForm({
        species: existing.species || '',
        weight: existing.weight || '',
        length: existing.length || '',
        location: existing.location || '',
        lat: existing.lat || '',
        lng: existing.lng || '',
        date: existing.date || '',
        weather: existing.weather || '',
        weatherTemp: existing.weatherTemp || '',
        weatherWind: existing.weatherWind || '',
        weatherPressure: existing.weatherPressure || '',
        weatherCondition: existing.weatherCondition || '',
        weatherCloudCover: existing.weatherCloudCover || '',
        waterTemp: existing.waterTemp || '',
        flowRate: existing.flowRate || '',
        depth: existing.depth || '',
        waterStation: existing.waterStation || '',
        bait: existing.bait || '',
        lureImage: existing.lureImage || existing.lureImageUrl || '',
        lureType: existing.lureType || '',
        lureName: existing.lureName || '',
        lureCategory: existing.lureCategory || '',
        lureColor: existing.lureColor || '',
        released: existing.released !== undefined ? existing.released : true,
        visibility: existing.visibility || 'public',
        notes: existing.notes || '',
        image: existing.image || existing.imageUrl || '',
      });
    }
  }, [existing]);

  useEffect(() => {
    const lat = location.state?.lat;
    const lng = location.state?.lng;
    if (lat != null && lng != null) {
      fetchLocationData(lat, lng);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function parseNumber(str) {
    if (!str) return '';
    const match = str.match(/([\d.]+)/);
    return match ? parseFloat(match[1]) : '';
  }

  async function handleImageChange(img) {
    setForm((prev) => ({ ...prev, image: img }));
    setFishIdConfirmed(null);
    setCorrectedSpecies('');
    if (img) setPhotoError('');
    if (!img) {
      setFishIdResult(null);
      setFishIdError('');
      return;
    }

    const apiKey = getApiKey();
    if (!apiKey) return;

    setFishIdLoading(true);
    setFishIdError('');
    setFishIdResult(null);

    try {
      const result = await identifyFish(img, apiKey);
      setFishIdResult(result);
      if (result.confidence >= 50) {
        setForm((prev) => ({
          ...prev,
          species: result.species || prev.species,
          weight: parseNumber(result.estimatedWeight) || prev.weight,
          length: parseNumber(result.estimatedLength) || prev.length,
        }));
      }
    } catch (err) {
      setFishIdError(err.message);
    } finally {
      setFishIdLoading(false);
    }
  }

  function handleSuggestionSelect(species) {
    setForm((prev) => ({ ...prev, species }));
    setFishIdConfirmed(true);
  }

  function handleConfirmYes() {
    setFishIdConfirmed(true);
  }

  function handleConfirmNo() {
    setFishIdConfirmed(false);
    setCorrectedSpecies('');
  }

  function handleCorrectionSubmit() {
    if (correctedSpecies.trim()) {
      setForm((prev) => ({ ...prev, species: correctedSpecies.trim() }));
    }
  }

  function handleLureIdentified(data) {
    setForm((prev) => ({
      ...prev,
      bait: data.bait || prev.bait,
      lureType: data.lureType || prev.lureType,
      lureName: data.lureName || prev.lureName,
      lureCategory: data.lureCategory || prev.lureCategory,
      lureColor: data.lureColor || prev.lureColor,
      lureImage: data.lureImage || prev.lureImage,
    }));
  }

  async function fetchLocationData(lat, lng) {
    const [placeName, weatherData, waterData] = await Promise.all([
      reverseGeocode(lat, lng).catch(() => null),
      fetchWeather(lat, lng).catch(() => null),
      fetchWaterData(lat, lng).catch(() => null),
    ]);

    setForm((prev) => ({
      ...prev,
      lat,
      lng,
      location: prev.location || placeName || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      weather: weatherData ? weatherData.summary : prev.weather,
      weatherTemp: weatherData?.temp ?? prev.weatherTemp,
      weatherWind: weatherData?.wind ?? prev.weatherWind,
      weatherPressure: weatherData?.pressure ?? prev.weatherPressure,
      weatherCondition: weatherData?.condition ?? prev.weatherCondition,
      weatherCloudCover: weatherData?.cloudCover ?? prev.weatherCloudCover,
      waterTemp: waterData?.waterTemp ?? prev.waterTemp,
      flowRate: waterData?.flowRate ?? prev.flowRate,
      depth: waterData?.gaugeHeight ?? prev.depth,
      waterStation: waterData?.stationName ?? prev.waterStation,
    }));
  }

  async function handleGetLocation() {
    setGpsLoading(true);
    setGpsError('');

    try {
      const { lat, lng } = await getGPSLocation();
      await fetchLocationData(lat, lng);
    } catch (err) {
      setGpsError(err.message);
    } finally {
      setGpsLoading(false);
    }
  }

  async function handleManualCoords() {
    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);
    if (isNaN(lat) || isNaN(lng)) {
      setGpsError('Enter valid latitude and longitude values.');
      return;
    }
    setGpsLoading(true);
    setGpsError('');
    try {
      await fetchLocationData(lat, lng);
    } catch (err) {
      setGpsError(err.message);
    } finally {
      setGpsLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.image) {
      setPhotoError('A photo is required to log a catch.');
      return;
    }
    setSubmitting(true);
    const entry = {
      ...form,
      weight: form.weight ? Number(form.weight) : '',
      length: form.length ? Number(form.length) : '',
      weatherTemp: form.weatherTemp ? Number(form.weatherTemp) : '',
      weatherWind: form.weatherWind ? Number(form.weatherWind) : '',
      weatherPressure: form.weatherPressure ? Number(form.weatherPressure) : '',
      weatherCloudCover: form.weatherCloudCover !== '' ? Number(form.weatherCloudCover) : '',
      waterTemp: form.waterTemp ? Number(form.waterTemp) : '',
      flowRate: form.flowRate ? Number(form.flowRate) : '',
      depth: form.depth ? Number(form.depth) : '',
      aiSpecies: fishIdResult?.species || '',
      aiConfidence: fishIdResult?.confidence ?? null,
      aiEstimatedAge: fishIdResult?.estimatedAge || '',
      correctedSpecies: fishIdConfirmed === false && correctedSpecies.trim() ? correctedSpecies.trim() : '',
      speciesConfirmed: fishIdConfirmed,
    };

    if (!navigator.onLine) {
      try {
        await addPendingCatch(entry);
        toast.success('Saved offline! Will sync when back online.');
      } catch (err) {
        console.error('Failed to save offline:', err);
        toast.error('Failed to save catch offline.');
      }
      navigate('/');
      return;
    }

    try {
      await onSubmit(entry);
      toast.success('Catch saved!');
      if (form.released) {
        setTimeout(() => toast.info(getRandomTip()), 500);
      }
      navigate('/');
    } catch (err) {
      console.error('Failed to save catch:', err);
      toast.error('Failed to save catch.');
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2 className={styles.heading}>{existing ? 'Edit Catch' : 'Log a Catch'}</h2>

      {/* GPS Button */}
      <div className={styles.gpsSection}>
        <button type="button" className={styles.gpsBtn} onClick={handleGetLocation} disabled={gpsLoading}>
          {gpsLoading ? (
            <><span className={styles.gpsSpinner} /> Getting location...</>
          ) : (
            <>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
              </svg>
              Auto-fill location, weather &amp; water data
            </>
          )}
        </button>
        {form.lat && form.lng && !gpsError && (
          <span className={styles.gpsCoords}>GPS: {Number(form.lat).toFixed(4)}, {Number(form.lng).toFixed(4)}</span>
        )}
        {gpsError && (
          <div className={styles.gpsFallback}>
            <span className={styles.gpsError}>{gpsError}</span>
            <span className={styles.gpsFallbackLabel}>Enter coordinates manually:</span>
            <div className={styles.gpsFallbackRow}>
              <input
                className={styles.gpsFallbackInput}
                name="lat"
                type="number"
                step="any"
                placeholder="Latitude"
                value={form.lat}
                onChange={handleChange}
              />
              <input
                className={styles.gpsFallbackInput}
                name="lng"
                type="number"
                step="any"
                placeholder="Longitude"
                value={form.lng}
                onChange={handleChange}
              />
              <button type="button" className={styles.gpsFallbackBtn} onClick={handleManualCoords} disabled={gpsLoading}>
                {gpsLoading ? 'Loading...' : 'Fetch Data'}
              </button>
            </div>
          </div>
        )}
      </div>

      <RegulationBadge lat={form.lat} lng={form.lng} species={form.species} />

      <div className={styles.releaseToggle}>
        <div className={styles.releaseHeader}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="#2e7d32">
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20c2.21 0 4-1.79 4-4h-2a2 2 0 0 1-2 2 2.13 2.13 0 0 1-1.53-.67L12 4h2l-1 4h4l-1 4h4L17 8z" />
          </svg>
          <span className={styles.releaseLabel}>Catch &amp; Release</span>
          <button
            type="button"
            className={`${styles.toggleSwitch} ${form.released ? styles.toggleOn : ''}`}
            onClick={() => setForm((prev) => ({ ...prev, released: !prev.released }))}
            aria-label="Toggle catch and release"
          >
            <span className={styles.toggleKnob} />
          </button>
        </div>
        {form.released && (
          <span className={styles.releaseHint}>This fish will be released back into the water</span>
        )}
      </div>

      <div className={styles.grid}>
        <label className={styles.field}>
          <span>Species *</span>
          <input name="species" value={form.species} onChange={handleChange} required placeholder="e.g. Largemouth Bass" />
        </label>

        <label className={styles.field}>
          <span>Weight (lbs)</span>
          <input name="weight" type="number" step="0.01" min="0" value={form.weight} onChange={handleChange} placeholder="e.g. 4.5" />
        </label>

        <label className={styles.field}>
          <span>Length (in)</span>
          <input name="length" type="number" step="0.1" min="0" value={form.length} onChange={handleChange} placeholder="e.g. 18" />
        </label>

        <label className={styles.field}>
          <span>Location</span>
          <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Lake Travis" />
        </label>

        <label className={styles.field}>
          <span>Date / Time</span>
          <input name="date" type="datetime-local" value={form.date} onChange={handleChange} />
        </label>

        <label className={styles.field}>
          <span>Weather</span>
          <input name="weather" value={form.weather} onChange={handleChange} placeholder="e.g. Sunny, 75°F" />
        </label>

        <label className={styles.field}>
          <span>Water Temp (°F)</span>
          <input name="waterTemp" type="number" step="0.1" value={form.waterTemp} onChange={handleChange} placeholder="Auto-filled via GPS" />
        </label>

        <label className={styles.field}>
          <span>Flow Rate (ft³/s)</span>
          <input name="flowRate" type="number" step="1" value={form.flowRate} onChange={handleChange} placeholder="Auto-filled via GPS" />
        </label>

        <label className={styles.field}>
          <span>Depth (ft)</span>
          <input name="depth" type="number" step="0.1" min="0" value={form.depth} onChange={handleChange} placeholder="Depth at catch location" />
        </label>

        <label className={styles.field}>
          <span>Bait / Lure</span>
          <input name="bait" value={form.bait} onChange={handleChange} placeholder="e.g. Plastic worm" />
        </label>

        <div className={styles.lureIdField}>
          <QuickLureId onIdentified={handleLureIdentified} />
        </div>

        {form.lureName && (
          <div className={styles.lureInfo}>
            <span className={styles.lureInfoLabel}>AI-identified lure:</span>
            <div className={styles.lureTags}>
              <span className={styles.lureTag}>{form.lureName}</span>
              {form.lureType && <span className={styles.lureTag}>{form.lureType}</span>}
              {form.lureColor && <span className={styles.lureTag}>{form.lureColor}</span>}
            </div>
          </div>
        )}

        <ImageUpload image={form.image} onChange={handleImageChange} />
        {photoError && (
          <div className={styles.fishIdError}>{photoError}</div>
        )}

        {fishIdLoading && (
          <div className={styles.fishIdStatus}>
            <span className={styles.gpsSpinner} /> Identifying fish...
          </div>
        )}
        {fishIdError && (
          <div className={styles.fishIdError}>{fishIdError}</div>
        )}
        {fishIdResult && fishIdResult.confidence > 0 && !fishIdLoading && (
          <div className={styles.fishIdSection}>
            <div className={styles.fishIdInfo}>
              <span className={styles.fishIdLabel}>AI-identified fish:</span>
              <div className={styles.fishIdTags}>
                <span className={styles.fishIdTag}>{fishIdResult.species}</span>
                {fishIdResult.estimatedWeight && <span className={styles.fishIdTag}>{fishIdResult.estimatedWeight}</span>}
                {fishIdResult.estimatedLength && <span className={styles.fishIdTag}>{fishIdResult.estimatedLength}</span>}
                {fishIdResult.estimatedAge && <span className={styles.fishIdTag}>Age: {fishIdResult.estimatedAge}</span>}
              </div>
            </div>

            {/* Confidence bar */}
            <div className={styles.confidenceBarWrap}>
              <div className={styles.confidenceBarTrack}>
                <div
                  className={`${styles.confidenceBarFill} ${
                    fishIdResult.confidence >= 80 ? styles.confidenceHigh :
                    fishIdResult.confidence >= 50 ? styles.confidenceMed :
                    styles.confidenceLow
                  }`}
                  style={{ width: `${fishIdResult.confidence}%` }}
                />
              </div>
              <span className={styles.confidenceBarLabel}>{fishIdResult.confidence}% confidence</span>
            </div>

            {/* Suggestion cards when confidence < 80 and not confirmed */}
            {fishIdResult.confidence < 80 && fishIdConfirmed === null && fishIdResult.alternatives?.length > 0 && (
              <div className={styles.suggestions}>
                <span className={styles.suggestionsLabel}>Could also be:</span>
                <div className={styles.suggestionCards}>
                  <button
                    type="button"
                    className={styles.suggestionCard}
                    onClick={() => handleSuggestionSelect(fishIdResult.species)}
                  >
                    <span className={styles.suggestionSpecies}>{fishIdResult.species}</span>
                    <span className={styles.suggestionConf}>{fishIdResult.confidence}%</span>
                  </button>
                  {fishIdResult.alternatives.map((alt, i) => (
                    <button
                      type="button"
                      key={i}
                      className={styles.suggestionCard}
                      onClick={() => handleSuggestionSelect(alt.species)}
                    >
                      <span className={styles.suggestionSpecies}>{alt.species}</span>
                      <span className={styles.suggestionConf}>{alt.confidence}%</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Confirm / Correct prompt */}
            {fishIdConfirmed === null && fishIdResult.confidence >= 80 && (
              <div className={styles.confirmRow}>
                <span className={styles.confirmLabel}>Is this correct?</span>
                <div className={styles.confirmBtns}>
                  <button type="button" className={styles.confirmYes} onClick={handleConfirmYes}>Yes</button>
                  <button type="button" className={styles.confirmNo} onClick={handleConfirmNo}>No</button>
                </div>
              </div>
            )}

            {/* Correction input */}
            {fishIdConfirmed === false && (
              <div className={styles.correctionRow}>
                <label className={styles.correctionLabel}>What species is it?</label>
                <div className={styles.correctionInputRow}>
                  <input
                    type="text"
                    className={styles.correctionInput}
                    value={correctedSpecies}
                    onChange={(e) => setCorrectedSpecies(e.target.value)}
                    placeholder="Enter correct species..."
                  />
                  <button
                    type="button"
                    className={styles.correctionBtn}
                    onClick={handleCorrectionSubmit}
                    disabled={!correctedSpecies.trim()}
                  >
                    Update
                  </button>
                </div>
              </div>
            )}

            {/* Species info card after confirmation */}
            {fishIdConfirmed !== null && (
              <SpeciesInfoCard speciesName={form.species} />
            )}
          </div>
        )}
      </div>

      {form.waterStation && (
        <div className={styles.stationInfo}>
          Water data from: {form.waterStation}
        </div>
      )}

      <div className={styles.visibilityRow}>
        <label className={styles.field}>
          <span>Visibility</span>
          <select name="visibility" value={form.visibility} onChange={handleChange}>
            <option value="public">Public</option>
            <option value="friends">Friends Only</option>
            <option value="private">Private</option>
          </select>
        </label>
      </div>

      <label className={styles.field}>
        <span>Notes</span>
        <textarea name="notes" rows={3} value={form.notes} onChange={handleChange} placeholder="Any extra details..." />
      </label>

      <div className={styles.actions}>
        <button type="submit" className={styles.submitBtn} disabled={submitting}>
          {submitting ? 'Uploading & Saving...' : existing ? 'Save Changes' : 'Add Catch'}
        </button>
        <button type="button" className={styles.cancelBtn} onClick={() => navigate('/')}>
          Cancel
        </button>
      </div>
    </form>
  );
}
