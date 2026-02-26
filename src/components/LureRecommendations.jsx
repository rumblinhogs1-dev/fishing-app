import { useState } from 'react';
import { getApiKey } from '../utils/gemini';
import { getRecommendations } from '../utils/geminiRecommend';
import { getGPSLocation, reverseGeocode, fetchWeather, fetchWaterData } from '../utils/weather';
import { createCooldown } from '../utils/rateLimit';
import styles from './LureRecommendations.module.css';

const cooldown = createCooldown();

function getCurrentSeason() {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Fall';
  return 'Winter';
}

export default function LureRecommendations() {
  const [form, setForm] = useState({
    species: '',
    location: '',
    weather: '',
    waterTemp: '',
    flowRate: '',
    season: getCurrentSeason(),
  });
  const [gpsLoading, setGpsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleGPS() {
    setGpsLoading(true);
    try {
      const { lat, lng } = await getGPSLocation();
      const [placeName, weatherData, waterData] = await Promise.all([
        reverseGeocode(lat, lng).catch(() => null),
        fetchWeather(lat, lng).catch(() => null),
        fetchWaterData(lat, lng).catch(() => null),
      ]);
      setForm((prev) => ({
        ...prev,
        location: placeName || prev.location,
        weather: weatherData?.summary || prev.weather,
        waterTemp: waterData?.waterTemp ?? prev.waterTemp,
        flowRate: waterData?.flowRate ?? prev.flowRate,
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setGpsLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const key = getApiKey();
    if (!key) {
      setError('No API key configured. Go to Fish ID page to set your Gemini API key.');
      return;
    }

    try { cooldown.check(); } catch (err) { setError(err.message); return; }

    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await getRecommendations(form, key);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>AI Lure Recommendations</h2>
      <p className={styles.subtext}>Get AI-powered lure and fly suggestions based on current conditions.</p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <button type="button" className={styles.gpsBtn} onClick={handleGPS} disabled={gpsLoading}>
          {gpsLoading ? (
            <><span className={styles.spinner} /> Getting conditions...</>
          ) : (
            <>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
              </svg>
              Auto-fill from GPS
            </>
          )}
        </button>

        <div className={styles.grid}>
          <label className={styles.field}>
            <span>Target Species</span>
            <input name="species" value={form.species} onChange={handleChange} placeholder="e.g. Largemouth Bass" />
          </label>
          <label className={styles.field}>
            <span>Location</span>
            <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Lake Travis, TX" />
          </label>
          <label className={styles.field}>
            <span>Weather</span>
            <input name="weather" value={form.weather} onChange={handleChange} placeholder="e.g. Sunny, 75°F" />
          </label>
          <label className={styles.field}>
            <span>Water Temp (°F)</span>
            <input name="waterTemp" type="number" value={form.waterTemp} onChange={handleChange} placeholder="e.g. 68" />
          </label>
          <label className={styles.field}>
            <span>Flow Rate (ft³/s)</span>
            <input name="flowRate" type="number" value={form.flowRate} onChange={handleChange} placeholder="e.g. 150" />
          </label>
          <label className={styles.field}>
            <span>Season</span>
            <select name="season" value={form.season} onChange={handleChange}>
              <option value="Spring">Spring</option>
              <option value="Summer">Summer</option>
              <option value="Fall">Fall</option>
              <option value="Winter">Winter</option>
            </select>
          </label>
        </div>

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? <><span className={styles.spinner} /> Getting Recommendations...</> : 'Get Recommendations'}
        </button>
      </form>

      {error && <div className={styles.error}>{error}</div>}

      {result && (
        <div className={styles.results}>
          {result.recommendations?.map((rec, i) => (
            <div key={i} className={styles.recCard}>
              <div className={styles.recHeader}>
                <div>
                  <h3 className={styles.recName}>{rec.name}</h3>
                  <span className={styles.recType}>{rec.type}</span>
                </div>
                <span className={styles.recConfidence} style={{
                  color: rec.confidence >= 75 ? '#4caf50' : rec.confidence >= 50 ? '#ff9800' : '#d32f2f',
                  borderColor: rec.confidence >= 75 ? '#4caf50' : rec.confidence >= 50 ? '#ff9800' : '#d32f2f',
                }}>
                  {rec.confidence}%
                </span>
              </div>
              <div className={styles.recDetails}>
                {rec.color && <span className={styles.recTag}>Color: {rec.color}</span>}
                {rec.size && <span className={styles.recTag}>Size: {rec.size}</span>}
              </div>
              {rec.technique && <p className={styles.recTechnique}><strong>Technique:</strong> {rec.technique}</p>}
              {rec.reasoning && <p className={styles.recReasoning}>{rec.reasoning}</p>}
            </div>
          ))}

          {result.hatchInfo && (
            <div className={styles.infoCard}>
              <h4>Hatch / Baitfish Activity</h4>
              <p>{result.hatchInfo}</p>
            </div>
          )}

          {result.generalTips && (
            <div className={styles.infoCard}>
              <h4>General Tips</h4>
              <p>{result.generalTips}</p>
            </div>
          )}

          {result.bestTimeOfDay && (
            <div className={styles.infoCard}>
              <h4>Best Time of Day</h4>
              <p>{result.bestTimeOfDay}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
