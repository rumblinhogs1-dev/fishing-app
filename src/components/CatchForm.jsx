import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ImageUpload from './ImageUpload';
import QuickLureId from './QuickLureId';
import RegulationBadge from './RegulationBadge';
import { getGPSLocation, reverseGeocode, fetchWeather, fetchWaterData } from '../utils/weather';
import { identifyFish, getApiKey } from '../utils/gemini';
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
  waterTemp: '',
  flowRate: '',
  waterStation: '',
  bait: '',
  lureImage: '',
  lureType: '',
  lureName: '',
  lureCategory: '',
  lureColor: '',
  visibility: 'public',
  notes: '',
  image: '',
};

export default function CatchForm({ existing, onSubmit }) {
  const [form, setForm] = useState(EMPTY);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fishIdLoading, setFishIdLoading] = useState(false);
  const [fishIdResult, setFishIdResult] = useState(null);
  const [fishIdError, setFishIdError] = useState('');
  const navigate = useNavigate();

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
        waterTemp: existing.waterTemp || '',
        flowRate: existing.flowRate || '',
        waterStation: existing.waterStation || '',
        bait: existing.bait || '',
        lureImage: existing.lureImage || existing.lureImageUrl || '',
        lureType: existing.lureType || '',
        lureName: existing.lureName || '',
        lureCategory: existing.lureCategory || '',
        lureColor: existing.lureColor || '',
        visibility: existing.visibility || 'public',
        notes: existing.notes || '',
        image: existing.image || existing.imageUrl || '',
      });
    }
  }, [existing]);

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

  async function handleGetLocation() {
    setGpsLoading(true);
    setGpsError('');

    try {
      const { lat, lng } = await getGPSLocation();
      setForm((prev) => ({ ...prev, lat, lng }));

      const [placeName, weatherData, waterData] = await Promise.all([
        reverseGeocode(lat, lng).catch(() => null),
        fetchWeather(lat, lng).catch(() => null),
        fetchWaterData(lat, lng).catch(() => null),
      ]);

      setForm((prev) => ({
        ...prev,
        location: prev.location || placeName || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        weather: weatherData ? weatherData.summary : prev.weather,
        waterTemp: waterData?.waterTemp ?? prev.waterTemp,
        flowRate: waterData?.flowRate ?? prev.flowRate,
        waterStation: waterData?.stationName ?? prev.waterStation,
      }));
    } catch (err) {
      setGpsError(err.message);
    } finally {
      setGpsLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        weight: form.weight ? Number(form.weight) : '',
        length: form.length ? Number(form.length) : '',
        waterTemp: form.waterTemp ? Number(form.waterTemp) : '',
        flowRate: form.flowRate ? Number(form.flowRate) : '',
      });
      navigate('/');
    } catch (err) {
      console.error('Failed to save catch:', err);
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
        {form.lat && form.lng && (
          <span className={styles.gpsCoords}>GPS: {Number(form.lat).toFixed(4)}, {Number(form.lng).toFixed(4)}</span>
        )}
        {gpsError && <span className={styles.gpsError}>{gpsError}</span>}
      </div>

      <RegulationBadge lat={form.lat} lng={form.lng} species={form.species} />

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

        {fishIdLoading && (
          <div className={styles.fishIdStatus}>
            <span className={styles.gpsSpinner} /> Identifying fish...
          </div>
        )}
        {fishIdError && (
          <div className={styles.fishIdError}>{fishIdError}</div>
        )}
        {fishIdResult && fishIdResult.confidence > 0 && !fishIdLoading && (
          <div className={styles.fishIdInfo}>
            <span className={styles.fishIdLabel}>AI-identified fish:</span>
            <div className={styles.fishIdTags}>
              <span className={styles.fishIdTag}>{fishIdResult.species}</span>
              <span className={styles.fishIdConfidence}>{fishIdResult.confidence}% confident</span>
              {fishIdResult.estimatedWeight && <span className={styles.fishIdTag}>{fishIdResult.estimatedWeight}</span>}
              {fishIdResult.estimatedLength && <span className={styles.fishIdTag}>{fishIdResult.estimatedLength}</span>}
            </div>
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
          {submitting ? 'Saving...' : existing ? 'Save Changes' : 'Add Catch'}
        </button>
        <button type="button" className={styles.cancelBtn} onClick={() => navigate('/')}>
          Cancel
        </button>
      </div>
    </form>
  );
}
