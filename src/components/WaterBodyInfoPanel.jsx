import { useState, useEffect } from 'react';
import { reverseGeocode, fetchWaterData } from '../utils/weather';
import { getSeasonalCalendar } from '../utils/geminiSeasonalCalendar';
import { getRecommendations } from '../utils/geminiRecommend';
import SeasonalCalendar from './SeasonalCalendar';
import styles from './WaterBodyInfoPanel.module.css';

function getSeason() {
  const m = new Date().getMonth();
  if (m >= 2 && m <= 4) return 'Spring';
  if (m >= 5 && m <= 7) return 'Summer';
  if (m >= 8 && m <= 10) return 'Fall';
  return 'Winter';
}

export default function WaterBodyInfoPanel({ lat, lng, onClose }) {
  const [waterBodyName, setWaterBodyName] = useState('');

  // Water conditions
  const [waterData, setWaterData] = useState(null);
  const [waterLoading, setWaterLoading] = useState(true);
  const [waterError, setWaterError] = useState('');

  // Seasonal calendar
  const [calendarData, setCalendarData] = useState(null);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarError, setCalendarError] = useState('');

  // AI Recommendations (lazy)
  const [recsData, setRecsData] = useState(null);
  const [recsLoading, setRecsLoading] = useState(false);
  const [recsError, setRecsError] = useState('');

  // Toggle states
  const [showConditions, setShowConditions] = useState(true);
  const [showRecs, setShowRecs] = useState(false);
  const [showCalendar, setShowCalendar] = useState(true);

  // Fetch water conditions + calendar on mount
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const name = await reverseGeocode(lat, lng).catch(() => null);
      if (cancelled) return;
      setWaterBodyName(name || '');

      // Parallel fetch: water data + seasonal calendar
      const waterPromise = fetchWaterData(lat, lng)
        .then((data) => {
          if (!cancelled) {
            setWaterData(data);
            setWaterLoading(false);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setWaterError(err.message || 'Failed to load water data.');
            setWaterLoading(false);
          }
        });

      const calendarPromise = getSeasonalCalendar({ waterBodyName: name, lat, lng })
        .then((data) => {
          if (!cancelled) {
            setCalendarData(data);
            setCalendarLoading(false);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setCalendarError(err.message || 'Failed to load seasonal calendar.');
            setCalendarLoading(false);
          }
        });

      await Promise.all([waterPromise, calendarPromise]);
    }

    load();
    return () => { cancelled = true; };
  }, [lat, lng]);

  // Lazy-fetch recommendations when toggled on
  useEffect(() => {
    if (!showRecs || recsData || recsLoading) return;
    let cancelled = false;

    async function loadRecs() {
      setRecsLoading(true);
      setRecsError('');
      try {
        const data = await getRecommendations({
          location: waterBodyName || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          waterTemp: waterData?.waterTemp || undefined,
          flowRate: waterData?.flowRate || undefined,
          season: getSeason(),
        });
        if (!cancelled) setRecsData(data);
      } catch (err) {
        if (!cancelled) setRecsError(err.message || 'Failed to load recommendations.');
      } finally {
        if (!cancelled) setRecsLoading(false);
      }
    }

    loadRecs();
    return () => { cancelled = true; };
  }, [showRecs, recsData, recsLoading, waterBodyName, waterData, lat, lng]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Water Body Info</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        {waterBodyName && <p className={styles.location}>{waterBodyName}</p>}

        {/* Toggle: Water Conditions */}
        <div className={styles.toggleRow}>
          <span className={styles.toggleLabel}>Water Conditions</span>
          <button
            className={`${styles.toggleSwitch} ${showConditions ? styles.toggleOn : ''}`}
            onClick={() => setShowConditions((v) => !v)}
          >
            <span className={styles.toggleKnob} />
          </button>
        </div>

        {showConditions && (
          <div className={styles.sectionContent}>
            {waterLoading && (
              <div className={styles.loadingWrap}>
                <span className={styles.spinner} />
                <span>Loading water data...</span>
              </div>
            )}
            {waterError && <div className={styles.error}>{waterError}</div>}
            {!waterLoading && !waterError && waterData && (
              <>
                <div className={styles.conditionsGrid}>
                  {waterData.waterTemp != null && (
                    <div className={styles.condItem}>
                      <div className={styles.condValue}>{waterData.waterTemp}&deg;F</div>
                      <div className={styles.condLabel}>Water Temp</div>
                    </div>
                  )}
                  {waterData.flowRate != null && (
                    <div className={styles.condItem}>
                      <div className={styles.condValue}>{waterData.flowRate.toLocaleString()}</div>
                      <div className={styles.condLabel}>Flow (ft&sup3;/s)</div>
                    </div>
                  )}
                  {waterData.gaugeHeight != null && (
                    <div className={styles.condItem}>
                      <div className={styles.condValue}>{waterData.gaugeHeight} ft</div>
                      <div className={styles.condLabel}>Gauge Height</div>
                    </div>
                  )}
                </div>
                {waterData.stationName && (
                  <div className={styles.condStation}>{waterData.stationName}</div>
                )}
              </>
            )}
            {!waterLoading && !waterError && !waterData && (
              <div className={styles.noData}>No USGS water data available for this area.</div>
            )}
          </div>
        )}

        {/* Toggle: AI Recommendations */}
        <div className={styles.toggleRow}>
          <span className={styles.toggleLabel}>AI Recommendations</span>
          <button
            className={`${styles.toggleSwitch} ${showRecs ? styles.toggleOn : ''}`}
            onClick={() => setShowRecs((v) => !v)}
          >
            <span className={styles.toggleKnob} />
          </button>
        </div>

        {showRecs && (
          <div className={styles.sectionContent}>
            {recsLoading && (
              <div className={styles.loadingWrap}>
                <span className={styles.spinner} />
                <span>Getting recommendations...</span>
              </div>
            )}
            {recsError && <div className={styles.error}>{recsError}</div>}
            {recsData?.recommendations?.map((rec, i) => (
              <div key={i} className={styles.recCard}>
                <div className={styles.recType}>{rec.type}</div>
                <div className={styles.recName}>{rec.name}</div>
                {rec.color && <div className={styles.recDetail}>Color: {rec.color} | Size: {rec.size}</div>}
                {rec.technique && <div className={styles.recDetail}>{rec.technique}</div>}
              </div>
            ))}
            {recsData?.generalTips && (
              <div className={styles.recTips}>
                <strong>Tips:</strong> {recsData.generalTips}
              </div>
            )}
          </div>
        )}

        {/* Toggle: Seasonal Calendar */}
        <div className={styles.toggleRow}>
          <span className={styles.toggleLabel}>Seasonal Calendar</span>
          <button
            className={`${styles.toggleSwitch} ${showCalendar ? styles.toggleOn : ''}`}
            onClick={() => setShowCalendar((v) => !v)}
          >
            <span className={styles.toggleKnob} />
          </button>
        </div>

        {showCalendar && (
          <div className={styles.sectionContent}>
            {calendarLoading && (
              <div className={styles.loadingWrap}>
                <span className={styles.spinner} />
                <span>Loading seasonal data...</span>
              </div>
            )}
            {calendarError && <div className={styles.error}>{calendarError}</div>}
            {!calendarLoading && !calendarError && calendarData && (
              <SeasonalCalendar data={calendarData} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
