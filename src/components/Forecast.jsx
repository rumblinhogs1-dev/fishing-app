import { useState, useCallback, useEffect } from 'react';
import { getGPSLocation, geocodeLocation } from '../utils/weather';
import { WEATHER_CODES } from '../utils/weather';
import { getFullForecast, getShouldIFishScore } from '../utils/forecast';
import { IDEAL_TEMP_RANGES, getSpeciesTempStatus } from '../utils/solunar';
import { getSeasonalCalendar } from '../utils/geminiSeasonalCalendar';
import { getRecommendations } from '../utils/geminiRecommend';
import { getInsectHatch } from '../utils/geminiHatch';
import { getFlyPatternImage } from '../utils/flyPatternImage';
import SeasonalCalendar from './SeasonalCalendar';
import styles from './Forecast.module.css';

const DISPLAY_SPECIES = ['largemouth_bass', 'rainbow_trout', 'walleye', 'crappie', 'channel_catfish'];
const TEMP_BAR_MIN = 30;
const TEMP_BAR_MAX = 95;

function weatherEmoji(code) {
  if (code <= 1) return '\u2600\uFE0F';
  if (code <= 3) return '\u26C5';
  if (code <= 48) return '\uD83C\uDF2B\uFE0F';
  if (code <= 55) return '\uD83C\uDF26\uFE0F';
  if (code <= 67) return '\uD83C\uDF27\uFE0F';
  if (code <= 77) return '\u2744\uFE0F';
  if (code <= 82) return '\uD83C\uDF26\uFE0F';
  if (code <= 86) return '\uD83C\uDF28\uFE0F';
  return '\u26C8\uFE0F';
}

function windDirectionLabel(deg) {
  if (deg == null) return '';
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

function dayLabel(dateStr, index) {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tomorrow';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

function formatShortTime(isoTime) {
  if (!isoTime) return '';
  try {
    const d = new Date(isoTime);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } catch {
    return isoTime;
  }
}

// --- Sub-components (inline) ---

function HeroCard({ fishScore }) {
  if (!fishScore) return null;
  return (
    <div className={styles.heroCard} style={{ borderLeftColor: fishScore.color }}>
      <div className={styles.heroScore}>
        <div className={styles.heroNumber} style={{ color: fishScore.color }}>{fishScore.score}</div>
        <div className={styles.heroMeta}>
          <div className={styles.heroLabel}>Should I Fish?</div>
          <p className={styles.heroRec}>{fishScore.recommendation}</p>
        </div>
      </div>
      {fishScore.reasons.length > 0 && (
        <ul className={styles.heroReasons}>
          {fishScore.reasons.map((r, i) => <li key={i} className={styles.heroReason}>{r}</li>)}
        </ul>
      )}
      {fishScore.bestWindow && (
        <div className={styles.heroBestWindow}>
          Best window: {fishScore.bestWindow.start} - {fishScore.bestWindow.end} ({fishScore.bestWindow.reason})
        </div>
      )}
    </div>
  );
}

function ConditionsGrid({ current }) {
  if (!current) return null;
  return (
    <div className={styles.conditionsGrid}>
      <div className={`${styles.condCard} ${styles.hasTooltip}`} data-tooltip="Air temp affects fish metabolism and feeding. Fish are most active in their preferred range — trout: 50-65°F, bass: 65-80°F. Extreme temps push fish deeper.">
        <div className={styles.condValue}>{current.temp != null ? `${current.temp}\u00B0F` : '--'}</div>
        <div className={styles.condLabel}>Temperature</div>
      </div>
      <div className={`${styles.condCard} ${styles.hasTooltip}`} data-tooltip="Light wind (5-15 mph) is ideal — it breaks the surface, reducing fish wariness and pushing baitfish. Calm water makes fish spooky. Strong wind muddies water and makes casting difficult.">
        <div className={styles.condValue}>{current.windSpeed != null ? `${current.windSpeed} mph` : '--'}</div>
        <div className={styles.condLabel}>Wind</div>
        {current.windGusts != null && <div className={styles.condDetail}>Gusts {current.windGusts} mph</div>}
      </div>
      <div className={`${styles.condCard} ${styles.hasTooltip}`} data-tooltip="Falling pressure = fish feed aggressively before a storm. Steady pressure = normal activity. Rising pressure = slower bite as fish adjust. Rapid drops trigger the best feeding windows.">
        <div className={styles.condValue}>{current.pressure != null ? `${current.pressure}` : '--'}</div>
        <div className={styles.condLabel}>Pressure (hPa)</div>
        {current.pressureTrend && <div className={styles.condDetail}>{current.pressureTrend === 'rising' ? '\u2191' : current.pressureTrend === 'falling' ? '\u2193' : '\u2192'} {current.pressureTrend}</div>}
      </div>
      <div className={`${styles.condCard} ${styles.hasTooltip}`} data-tooltip="Overcast skies make fish feel safer and feed longer. Bright sun pushes fish to shade, deeper water, or cover. Cloudy days are often the best for topwater action.">
        <div className={styles.condValue}>{current.cloudCover != null ? `${current.cloudCover}%` : '--'}</div>
        <div className={styles.condLabel}>Cloud Cover</div>
      </div>
      <div className={`${styles.condCard} ${styles.hasTooltip}`} data-tooltip="High humidity (70%+) often means insect hatches are more active, boosting fly fishing. It also signals incoming weather changes. Low humidity can slow surface feeding activity.">
        <div className={styles.condValue}>{current.humidity != null ? `${current.humidity}%` : '--'}</div>
        <div className={styles.condLabel}>Humidity</div>
      </div>
    </div>
  );
}

function BiteScoreGauge({ biteScore }) {
  if (!biteScore) return null;
  const pct = ((biteScore.score - 1) / 9) * 100;
  return (
    <div className={styles.section}>
      <h3 className={`${styles.sectionTitle} ${styles.hasTooltip}`} data-tooltip="Bite Score combines moon phase, solunar periods, pressure trend, wind, cloud cover, and time of day into a single 1-10 rating. Scores 7+ mean conditions strongly favor feeding. Plan your trips around the highest scores.">Bite Score: {biteScore.score}/10 - {biteScore.label}</h3>
      <div className={styles.gaugeLabel}><span>Poor</span><span>Fair</span><span>Good</span><span>Excellent</span></div>
      <div className={styles.gauge}>
        <div className={styles.gaugeFill} style={{ width: `${pct}%` }} />
      </div>
      {biteScore.factors.map((f, i) => (
        <div key={i} className={styles.factorRow}>
          <div className={styles.factorDot} style={{ background: f.points >= f.max * 0.7 ? '#2e7d32' : f.points >= f.max * 0.4 ? '#f9a825' : '#c62828' }} />
          <div className={styles.factorName}>{f.name}</div>
          <div className={styles.factorBar}>
            <div className={styles.factorBarFill} style={{ width: `${(f.points / f.max) * 100}%` }} />
          </div>
          <div className={styles.factorDetail}>{f.detail}</div>
        </div>
      ))}
    </div>
  );
}

function MoonSolunarSection({ day }) {
  if (!day?.moonPhase) return null;
  const { moonPhase, solunarPeriods, bestWindows } = day;
  const allPeriods = [...(solunarPeriods?.majorPeriods || []), ...(solunarPeriods?.minorPeriods || [])];

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Moon & Solunar</h3>
      <div className={`${styles.moonHeader} ${styles.hasTooltip}`} data-tooltip="New and full moons produce stronger tides and more fish activity. The 3 days around a full or new moon are peak feeding times. Quarter moons tend to have the slowest bite.">
        <span className={styles.moonEmoji}>{moonPhase.emoji}</span>
        <div className={styles.moonInfo}>
          <span className={styles.moonPhase}>{moonPhase.name}</span>
          <span className={styles.moonIllum}>{moonPhase.illumination}% illumination</span>
        </div>
      </div>

      <div className={styles.timeline}>
        {allPeriods.map((p, i) => {
          const startPct = (p.startMin / 1440) * 100;
          const widthPct = ((p.endMin > p.startMin ? p.endMin - p.startMin : 1440 - p.startMin + p.endMin) / 1440) * 100;
          return (
            <div
              key={i}
              className={styles.timelinePeriod}
              style={{
                left: `${startPct}%`,
                width: `${Math.max(widthPct, 2)}%`,
                background: p.type === 'major' ? '#1a73e8' : '#90caf9',
              }}
              title={`${p.label}: ${p.start} - ${p.end}`}
            >
              {widthPct > 6 ? p.label : ''}
            </div>
          );
        })}
      </div>
      <div className={styles.timelineLabels}>
        <span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>12 AM</span>
      </div>

      {bestWindows && bestWindows.length > 0 && (
        <>
          <h4 style={{ fontSize: '0.9rem', margin: '0 0 0.5rem', color: '#555' }}>Best Windows</h4>
          <ul className={styles.windowsList}>
            {bestWindows.map((w, i) => (
              <li key={i} className={styles.windowItem}>
                <span className={styles.windowDot} style={{ background: w.quality === 'high' ? '#2e7d32' : '#f9a825' }} />
                <span className={styles.windowTime}>{w.start} - {w.end}</span>
                <span className={styles.windowReason}>{w.reason}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function WaterTempSection({ waterData, manualTemp, onManualTemp }) {
  const temp = waterData?.waterTemp ?? manualTemp;
  return (
    <div className={styles.section}>
      <h3 className={`${styles.sectionTitle} ${styles.hasTooltip}`} data-tooltip="Water temp is the #1 factor for fish activity. Each species has a sweet spot — trout: 50-65°F, bass: 65-80°F, walleye: 55-70°F. Fish slow down outside their range and move deeper to find comfort zones.">Water Temperature</h3>
      {waterData?.waterTemp != null ? (
        <div className={styles.waterTempDisplay}>
          <div className={styles.waterTempValue}>{waterData.waterTemp}&deg;F</div>
          <div className={styles.waterTempMeta}>{waterData.stationName}</div>
        </div>
      ) : (
        <>
          <p style={{ fontSize: '0.85rem', color: '#888', margin: '0 0 0.5rem' }}>No USGS station nearby. Enter manually:</p>
          <div className={styles.manualInput}>
            <input type="number" placeholder="°F" min="30" max="100" onChange={e => onManualTemp(Number(e.target.value) || null)} />
            <span style={{ fontSize: '0.85rem', color: '#888' }}>&deg;F</span>
          </div>
        </>
      )}

      {temp != null && (
        <>
          <h4 style={{ fontSize: '0.9rem', margin: '0.75rem 0 0.5rem', color: '#555' }}>Species Ranges</h4>
          {DISPLAY_SPECIES.map(key => {
            const range = IDEAL_TEMP_RANGES[key];
            if (!range) return null;
            const status = getSpeciesTempStatus(key, temp);
            const toPercent = v => ((v - TEMP_BAR_MIN) / (TEMP_BAR_MAX - TEMP_BAR_MIN)) * 100;
            return (
              <div key={key} className={styles.speciesBar}>
                <span className={styles.speciesName}>{range.label}</span>
                <div className={styles.speciesRange}>
                  <div className={styles.speciesGood} style={{ left: `${toPercent(range.good[0])}%`, width: `${toPercent(range.good[1]) - toPercent(range.good[0])}%` }} />
                  <div className={styles.speciesIdeal} style={{ left: `${toPercent(range.ideal[0])}%`, width: `${toPercent(range.ideal[1]) - toPercent(range.ideal[0])}%` }} />
                  <div className={styles.speciesMarker} style={{ left: `${Math.max(0, Math.min(100, toPercent(temp)))}%` }} />
                </div>
                <span className={styles.speciesStatus} style={{ color: status.status === 'ideal' ? '#2e7d32' : status.status === 'good' ? '#f9a825' : '#c62828' }}>
                  {status.label}
                </span>
              </div>
            );
          })}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#aaa', marginTop: '0.25rem', paddingLeft: '120px' }}>
            <span>{TEMP_BAR_MIN}&deg;</span><span>{TEMP_BAR_MAX}&deg;F</span>
          </div>
        </>
      )}
    </div>
  );
}

function WindArrowSVG({ direction }) {
  return (
    <svg className={styles.windArrow} viewBox="0 0 60 60" style={{ transform: `rotate(${direction || 0}deg)` }}>
      <circle cx="30" cy="30" r="28" fill="none" stroke="#ddd" strokeWidth="2" />
      <polygon points="30,6 24,38 30,32 36,38" fill="#1a73e8" />
    </svg>
  );
}

function WindTideSection({ current, tideData, waterData, windDir }) {
  return (
    <div className={styles.section}>
      <h3 className={`${styles.sectionTitle} ${styles.hasTooltip}`} data-tooltip="Moving tides are key — the best fishing is during incoming (flood) and outgoing (ebb) tides, especially the first 2 hours of each. Slack tide (high/low) slows the bite. Incoming tides bring baitfish closer to shore.">Wind & {tideData ? 'Tides' : 'Flow'}</h3>
      <div className={styles.windDisplay}>
        <WindArrowSVG direction={windDir} />
        <div className={styles.windValues}>
          <div className={styles.windSpeed}>{current?.windSpeed ?? '--'} mph</div>
          {current?.windGusts != null && <div className={styles.windGust}>Gusts: {current.windGusts} mph</div>}
          <div className={styles.windDir}>{windDirectionLabel(windDir)} ({windDir ?? '--'}&deg;)</div>
        </div>
      </div>

      {tideData ? (
        <>
          <h4 style={{ fontSize: '0.9rem', margin: '0.5rem 0', color: '#555' }}>Tides - {tideData.stationName} ({tideData.stationDistance} mi)</h4>
          <TideChart predictions={tideData.predictions} />
        </>
      ) : waterData?.flowRate != null ? (
        <div className={styles.flowDisplay}>
          <div>
            <div className={styles.flowValue}>{waterData.flowRate.toLocaleString()}</div>
            <div className={styles.flowUnit}>ft&sup3;/s flow rate</div>
          </div>
          <div className={styles.waterTempMeta}>{waterData.stationName}</div>
        </div>
      ) : (
        <p style={{ fontSize: '0.85rem', color: '#888' }}>No tide or flow data available for this area.</p>
      )}
    </div>
  );
}

function TideChart({ predictions }) {
  if (!predictions?.length) return null;
  const w = 300;
  const h = 100;
  const padding = { top: 15, bottom: 20, left: 10, right: 10 };
  const plotW = w - padding.left - padding.right;
  const plotH = h - padding.top - padding.bottom;

  const heights = predictions.map(p => p.height);
  const minH = Math.min(...heights);
  const maxH = Math.max(...heights);
  const range = maxH - minH || 1;

  const points = predictions.map((p, i) => {
    const x = padding.left + (i / (predictions.length - 1)) * plotW;
    const y = padding.top + plotH - ((p.height - minH) / range) * plotH;
    return { x, y, ...p };
  });

  // Build smooth curve through points
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    pathD += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  return (
    <svg className={styles.tideChart} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
      <path d={pathD} fill="none" stroke="#1a73e8" strokeWidth="2" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill={p.type === 'High' ? '#2e7d32' : '#c62828'} />
          <text x={p.x} y={p.type === 'High' ? p.y - 6 : p.y + 12} textAnchor="middle" className={styles.tideLabel} fontSize="8">
            {p.type[0]} {p.time?.split(' ')[1] || ''}
          </text>
        </g>
      ))}
    </svg>
  );
}

function FiveDayForecast({ days, selectedDay, onSelectDay }) {
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>5-Day Forecast</h3>
      <div className={styles.dayRow}>
        {days.map((day, i) => (
          <div
            key={day.date}
            className={`${styles.dayCard} ${selectedDay === i ? styles.dayCardActive : ''}`}
            onClick={() => onSelectDay(selectedDay === i ? null : i)}
          >
            <span className={styles.dayName}>{dayLabel(day.date, i)}</span>
            <span className={styles.dayWeather}>{weatherEmoji(day.weatherCode)}</span>
            <span className={styles.dayTemps}>{day.tempMax ?? '--'}&deg; / {day.tempMin ?? '--'}&deg;</span>
            <span className={styles.dayMoon}>{day.moonPhase?.emoji}</span>
            <span className={styles.dayBiteDot} style={{
              background: (day.biteScore?.score ?? 0) >= 8 ? '#2e7d32' : (day.biteScore?.score ?? 0) >= 5 ? '#f9a825' : '#c62828',
            }} />
          </div>
        ))}
      </div>

      {selectedDay != null && days[selectedDay] && (
        <DayDetail day={days[selectedDay]} index={selectedDay} />
      )}
    </div>
  );
}

function DayDetail({ day, index }) {
  return (
    <div className={styles.dayDetail}>
      <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>{dayLabel(day.date, index)} Detail</h4>
      <div className={styles.dayDetailGrid}>
        <div className={styles.dayDetailItem}>
          <span className={styles.dayDetailLabel}>Weather</span>
          <span className={styles.dayDetailValue}>{WEATHER_CODES[day.weatherCode] || 'Unknown'}</span>
        </div>
        <div className={styles.dayDetailItem}>
          <span className={styles.dayDetailLabel}>High / Low</span>
          <span className={styles.dayDetailValue}>{day.tempMax}&deg; / {day.tempMin}&deg;F</span>
        </div>
        <div className={styles.dayDetailItem}>
          <span className={styles.dayDetailLabel}>Wind</span>
          <span className={styles.dayDetailValue}>{day.windMax ?? '--'} mph {windDirectionLabel(day.windDir)}</span>
        </div>
        <div className={`${styles.dayDetailItem} ${styles.hasTooltip}`} data-tooltip="Light rain is great — it breaks the surface, washes insects into the water, and reduces visibility so fish feel bolder. Heavy rain muddies water and can shut down the bite. Post-rain runoff often triggers excellent feeding.">
          <span className={styles.dayDetailLabel}>Precipitation</span>
          <span className={styles.dayDetailValue}>{day.precip}" </span>
        </div>
        <div className={`${styles.dayDetailItem} ${styles.hasTooltip}`} data-tooltip="The hour around sunrise is prime time — fish feed aggressively as light levels rise and baitfish become active. Dawn is often the best bite window of the day.">
          <span className={styles.dayDetailLabel}>Sunrise</span>
          <span className={styles.dayDetailValue}>{formatShortTime(day.sunrise)}</span>
        </div>
        <div className={`${styles.dayDetailItem} ${styles.hasTooltip}`} data-tooltip="The last hour before sunset triggers another feeding spree as fish take advantage of fading light. Topwater action peaks during the golden hour before dark.">
          <span className={styles.dayDetailLabel}>Sunset</span>
          <span className={styles.dayDetailValue}>{formatShortTime(day.sunset)}</span>
        </div>
        <div className={styles.dayDetailItem}>
          <span className={styles.dayDetailLabel}>Moon</span>
          <span className={styles.dayDetailValue}>{day.moonPhase?.emoji} {day.moonPhase?.name}</span>
        </div>
        <div className={styles.dayDetailItem}>
          <span className={styles.dayDetailLabel}>Bite Score</span>
          <span className={styles.dayDetailValue} style={{ color: day.biteScore?.color }}>{day.biteScore?.score}/10 {day.biteScore?.label}</span>
        </div>
      </div>
    </div>
  );
}

function HatchCard({ insect }) {
  const [expanded, setExpanded] = useState(false);
  const [flyImage, setFlyImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const activityColor = (level) => {
    if (level === 'high') return '#2e7d32';
    if (level === 'moderate') return '#f9a825';
    return '#999';
  };

  function handleClick() {
    const next = !expanded;
    setExpanded(next);
    if (next && !flyImage && !imageLoading && !imageFailed) {
      setImageLoading(true);
      getFlyPatternImage(insect.flyPattern, insect.name)
        .then((img) => {
          if (img) setFlyImage(img);
          else setImageFailed(true);
        })
        .catch(() => setImageFailed(true))
        .finally(() => setImageLoading(false));
    }
  }

  const searchUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(insect.flyPattern + ' fly fishing fly')}`;

  return (
    <div className={`${styles.hatchCard} ${expanded ? styles.hatchCardExpanded : ''}`} onClick={handleClick} role="button" tabIndex={0}>
      <div className={styles.hatchInsect}>
        {insect.name}
        <span className={styles.hatchOrder}>{insect.order}</span>
        <span className={styles.hatchExpandIcon}>{expanded ? '▾' : '▸'}</span>
      </div>
      <div className={styles.hatchPattern}>{insect.flyPattern}</div>
      <div className={styles.hatchMeta}>
        Size {insect.size} &middot; {insect.color}
        <span className={styles.hatchActivity} style={{ background: activityColor(insect.activityLevel) }} />
        {insect.activityLevel}
        {insect.bestTime && <> &middot; Best: {insect.bestTime}</>}
      </div>

      {expanded && (
        <div className={styles.hatchExpanded} onClick={(e) => e.stopPropagation()}>
          <div className={styles.hatchFlyImageWrap}>
            {imageLoading && <div className={styles.hatchFlyLoading}>Generating fly image...</div>}
            {flyImage && <img src={flyImage} alt={insect.flyPattern} className={styles.hatchFlyImage} />}
            {imageFailed && !flyImage && (
              <a href={searchUrl} target="_blank" rel="noopener noreferrer" className={styles.hatchFlyLink}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                View {insect.flyPattern} images
              </a>
            )}
          </div>
          <div className={styles.hatchFlyCaption}>
            <strong>{insect.flyPattern}</strong> — imitates the {insect.name} ({insect.order})
          </div>
        </div>
      )}
    </div>
  );
}

function HatchChart({ data }) {
  if (!data) return null;
  const intensityPct = (val) => Math.max(0, Math.min(100, ((val || 1) / 5) * 100));
  const intensityBg = (val) => {
    if (val >= 4) return 'rgba(46,125,50,0.15)';
    if (val >= 3) return 'rgba(249,168,37,0.12)';
    if (val >= 2) return 'rgba(0,0,0,0.05)';
    return 'rgba(0,0,0,0.02)';
  };

  return (
    <div>
      {/* Current Hatches */}
      {data.currentHatches?.length > 0 && (
        <>
          <h4 style={{ fontSize: '0.9rem', margin: '0 0 0.5rem', color: '#555' }}>Current Hatches <span style={{ fontSize: '0.75rem', color: '#999', fontWeight: 400 }}>— tap for fly photo</span></h4>
          {data.currentHatches.map((insect, i) => (
            <HatchCard key={i} insect={insect} />
          ))}
        </>
      )}

      {/* Daily Timeline */}
      {data.dailyTimeline?.length > 0 && (
        <>
          <h4 style={{ fontSize: '0.9rem', margin: '0.75rem 0 0.5rem', color: '#555' }}>Daily Timeline</h4>
          <div className={styles.hatchTimeline}>
            {data.dailyTimeline.map((slot, i) => (
              <div key={i} className={styles.hatchTimeRow}>
                <span className={styles.hatchTimePeriod}>{slot.period}</span>
                <div className={styles.hatchTimeBar}>
                  <div style={{ width: `${intensityPct(slot.intensity)}%`, height: '100%', borderRadius: 4, background: '#1a73e8', transition: 'width 0.3s' }} />
                </div>
                <span className={styles.hatchTimeInsects}>{(slot.insects || []).join(', ')}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Monthly Calendar */}
      {data.monthlyCalendar?.length > 0 && (
        <>
          <h4 style={{ fontSize: '0.9rem', margin: '0.75rem 0 0.5rem', color: '#555' }}>Monthly Calendar</h4>
          <div className={styles.hatchMonthGrid}>
            {data.monthlyCalendar.map((m, i) => (
              <div key={i} className={styles.hatchMonthCell} style={{ background: intensityBg(m.intensity) }}>
                <div className={styles.hatchMonthName}>{m.month?.slice(0, 3)}</div>
                <div className={styles.hatchMonthInsects}>{(m.insects || []).join(', ')}</div>
                {m.notes && <div style={{ fontSize: '0.65rem', color: '#888', marginTop: 2 }}>{m.notes}</div>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// --- Main Component ---

export default function Forecast() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [manualTemp, setManualTemp] = useState(null);
  const [locationQuery, setLocationQuery] = useState('');
  const [forecastCoords, setForecastCoords] = useState(null);

  // Water Body Info toggles
  const [showFcConditions, setShowFcConditions] = useState(true);
  const [showFcRecs, setShowFcRecs] = useState(false);
  const [showFcHatch, setShowFcHatch] = useState(false);
  const [showFcCalendar, setShowFcCalendar] = useState(false);

  // Water Body Info data
  const [fcCalendarData, setFcCalendarData] = useState(null);
  const [fcCalendarLoading, setFcCalendarLoading] = useState(false);
  const [fcCalendarError, setFcCalendarError] = useState('');

  const [fcRecsData, setFcRecsData] = useState(null);
  const [fcRecsLoading, setFcRecsLoading] = useState(false);
  const [fcRecsError, setFcRecsError] = useState('');

  const [fcHatchData, setFcHatchData] = useState(null);
  const [fcHatchLoading, setFcHatchLoading] = useState(false);
  const [fcHatchError, setFcHatchError] = useState('');

  const fetchForecast = useCallback(async (lat, lng) => {
    setLoading(true);
    setError(null);
    // Reset water body info when location changes
    setFcCalendarData(null);
    setFcCalendarError('');
    setFcRecsData(null);
    setFcRecsError('');
    setFcHatchData(null);
    setFcHatchError('');
    setForecastCoords({ lat, lng });
    try {
      const forecast = await getFullForecast(lat, lng);
      setData(forecast);
      setSelectedDay(null);
    } catch (err) {
      setError(err.message || 'Failed to load forecast.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { lat, lng } = await getGPSLocation();
      await fetchForecast(lat, lng);
    } catch (err) {
      setError(err.message || 'Failed to load forecast.');
      setLoading(false);
    }
  }, [fetchForecast]);

  const handleSearch = useCallback(async () => {
    const q = locationQuery.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    try {
      const { lat, lng } = await geocodeLocation(q);
      await fetchForecast(lat, lng);
    } catch (err) {
      setError(err.message || 'Failed to find location.');
      setLoading(false);
    }
  }, [locationQuery, fetchForecast]);

  // Lazy-fetch seasonal calendar when toggled on
  useEffect(() => {
    if (!showFcCalendar || fcCalendarData || fcCalendarLoading || !forecastCoords) return;
    let cancelled = false;
    async function load() {
      setFcCalendarLoading(true);
      setFcCalendarError('');
      try {
        const result = await getSeasonalCalendar({
          waterBodyName: data?.location || '',
          lat: forecastCoords.lat,
          lng: forecastCoords.lng,
        });
        if (!cancelled) setFcCalendarData(result);
      } catch (err) {
        if (!cancelled) setFcCalendarError(err.message || 'Failed to load seasonal calendar.');
      } finally {
        if (!cancelled) setFcCalendarLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFcCalendar, fcCalendarData, forecastCoords, data?.location]);

  // Lazy-fetch recommendations when toggled on
  useEffect(() => {
    if (!showFcRecs || fcRecsData || fcRecsLoading || !forecastCoords) return;
    let cancelled = false;
    function getSeason() {
      const m = new Date().getMonth();
      if (m >= 2 && m <= 4) return 'Spring';
      if (m >= 5 && m <= 7) return 'Summer';
      if (m >= 8 && m <= 10) return 'Fall';
      return 'Winter';
    }
    async function load() {
      setFcRecsLoading(true);
      setFcRecsError('');
      try {
        const result = await getRecommendations({
          location: data?.location || `${forecastCoords.lat.toFixed(4)}, ${forecastCoords.lng.toFixed(4)}`,
          waterTemp: data?.waterData?.waterTemp || undefined,
          flowRate: data?.waterData?.flowRate || undefined,
          season: getSeason(),
        });
        if (!cancelled) setFcRecsData(result);
      } catch (err) {
        if (!cancelled) setFcRecsError(err.message || 'Failed to load recommendations.');
      } finally {
        if (!cancelled) setFcRecsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFcRecs, fcRecsData, forecastCoords, data?.location, data?.waterData]);

  // Lazy-fetch insect hatch data when toggled on
  useEffect(() => {
    if (!showFcHatch || fcHatchData || fcHatchLoading || !forecastCoords) return;
    let cancelled = false;
    async function load() {
      setFcHatchLoading(true);
      setFcHatchError('');
      try {
        const result = await getInsectHatch({
          waterBodyName: data?.location || '',
          lat: forecastCoords.lat,
          lng: forecastCoords.lng,
          waterTemp: data?.waterData?.waterTemp || undefined,
          month: new Date().toLocaleString('en-US', { month: 'long' }),
        });
        if (!cancelled) setFcHatchData(result);
      } catch (err) {
        if (!cancelled) setFcHatchError(err.message || 'Failed to load insect hatch data.');
      } finally {
        if (!cancelled) setFcHatchLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFcHatch, fcHatchData, forecastCoords, data?.location, data?.waterData]);

  const fishScore = data ? getShouldIFishScore(data) : null;
  const today = data?.days?.[0] || null;
  const windDir = today?.windDir ?? data?.current?.windDir ?? null;

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Forecast</h2>

      <div className={styles.locationSection}>
        <button className={styles.gpsButton} onClick={handleFetch} disabled={loading}>
          {loading ? 'Loading...' : data ? 'Refresh My Location' : 'Use My Location'}
        </button>
        <div className={styles.locationDivider}><span>or</span></div>
        <div className={styles.searchRow}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="City, lake, zip code..."
            value={locationQuery}
            onChange={e => setLocationQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
            disabled={loading}
          />
          <button className={styles.searchBtn} onClick={handleSearch} disabled={loading || !locationQuery.trim()}>
            Search
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Fetching weather, water, tides & solunar data...</p>
        </div>
      )}

      {data && !loading && (
        <>
          {data.location && <p className={styles.location}>{data.location}</p>}

          <HeroCard fishScore={fishScore} />

          <ConditionsGrid current={data.current} />

          <BiteScoreGauge biteScore={today?.biteScore} />

          <MoonSolunarSection day={today} />

          <WaterTempSection waterData={data.waterData} manualTemp={manualTemp} onManualTemp={setManualTemp} />

          <WindTideSection current={data.current} tideData={data.tideData} waterData={data.waterData} windDir={windDir} />

          {/* Water Body Info Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Water Body Info</h3>

            {/* Toggle: Water Conditions */}
            <div className={styles.toggleRow}>
              <span className={styles.toggleLabel}>Water Conditions</span>
              <button
                className={`${styles.toggleSwitch} ${showFcConditions ? styles.toggleOn : ''}`}
                onClick={() => setShowFcConditions((v) => !v)}
              >
                <span className={styles.toggleKnob} />
              </button>
            </div>

            {showFcConditions && data.waterData && (
              <div style={{ padding: '0.5rem 0' }}>
                <div className={styles.conditionsGrid}>
                  {data.waterData.waterTemp != null && (
                    <div className={styles.condCard}>
                      <div className={styles.condValue}>{data.waterData.waterTemp}&deg;F</div>
                      <div className={styles.condLabel}>Water Temp</div>
                    </div>
                  )}
                  {data.waterData.flowRate != null && (
                    <div className={styles.condCard}>
                      <div className={styles.condValue}>{data.waterData.flowRate.toLocaleString()}</div>
                      <div className={styles.condLabel}>Flow (ft&sup3;/s)</div>
                    </div>
                  )}
                  {data.waterData.gaugeHeight != null && (
                    <div className={styles.condCard}>
                      <div className={styles.condValue}>{data.waterData.gaugeHeight} ft</div>
                      <div className={styles.condLabel}>Gauge Height</div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {showFcConditions && !data.waterData && (
              <p style={{ fontSize: '0.85rem', color: '#999', padding: '0.5rem 0' }}>No USGS water data available.</p>
            )}

            {/* Toggle: AI Recommendations */}
            <div className={styles.toggleRow}>
              <span className={styles.toggleLabel}>AI Recommendations</span>
              <button
                className={`${styles.toggleSwitch} ${showFcRecs ? styles.toggleOn : ''}`}
                onClick={() => setShowFcRecs((v) => !v)}
              >
                <span className={styles.toggleKnob} />
              </button>
            </div>

            {showFcRecs && (
              <div style={{ padding: '0.5rem 0' }}>
                {fcRecsLoading && (
                  <div className={styles.loading} style={{ padding: '1rem 0' }}>
                    <div className={styles.spinner} />
                    <p style={{ margin: 0 }}>Getting recommendations...</p>
                  </div>
                )}
                {fcRecsError && <div className={styles.error}>{fcRecsError}</div>}
                {fcRecsData?.recommendations?.map((rec, i) => (
                  <div key={i} className={styles.recCard}>
                    <div className={styles.recCardType}>{rec.type}</div>
                    <div className={styles.recCardName}>{rec.name}</div>
                    {rec.color && <div className={styles.recCardDetail}>Color: {rec.color} | Size: {rec.size}</div>}
                    {rec.technique && <div className={styles.recCardDetail}>{rec.technique}</div>}
                  </div>
                ))}
                {fcRecsData?.generalTips && (
                  <p style={{ fontSize: '0.82rem', color: '#555', margin: '0.5rem 0 0', background: '#fafafa', padding: '0.5rem', borderRadius: '6px' }}>
                    <strong>Tips:</strong> {fcRecsData.generalTips}
                  </p>
                )}
              </div>
            )}

            {/* Toggle: Insect Hatch Chart */}
            <div className={styles.toggleRow}>
              <span className={styles.toggleLabel}>Insect Hatch Chart</span>
              <button
                className={`${styles.toggleSwitch} ${showFcHatch ? styles.toggleOn : ''}`}
                onClick={() => setShowFcHatch((v) => !v)}
              >
                <span className={styles.toggleKnob} />
              </button>
            </div>

            {showFcHatch && (
              <div style={{ padding: '0.5rem 0' }}>
                {fcHatchLoading && (
                  <div className={styles.loading} style={{ padding: '1rem 0' }}>
                    <div className={styles.spinner} />
                    <p style={{ margin: 0 }}>Loading insect hatch data...</p>
                  </div>
                )}
                {fcHatchError && <div className={styles.error}>{fcHatchError}</div>}
                {!fcHatchLoading && !fcHatchError && fcHatchData && (
                  <HatchChart data={fcHatchData} />
                )}
              </div>
            )}

            {/* Toggle: Seasonal Calendar */}
            <div className={styles.toggleRow}>
              <span className={styles.toggleLabel}>Seasonal Calendar</span>
              <button
                className={`${styles.toggleSwitch} ${showFcCalendar ? styles.toggleOn : ''}`}
                onClick={() => setShowFcCalendar((v) => !v)}
              >
                <span className={styles.toggleKnob} />
              </button>
            </div>

            {showFcCalendar && (
              <div style={{ padding: '0.5rem 0' }}>
                {fcCalendarLoading && (
                  <div className={styles.loading} style={{ padding: '1rem 0' }}>
                    <div className={styles.spinner} />
                    <p style={{ margin: 0 }}>Loading seasonal data...</p>
                  </div>
                )}
                {fcCalendarError && <div className={styles.error}>{fcCalendarError}</div>}
                {!fcCalendarLoading && !fcCalendarError && fcCalendarData && (
                  <SeasonalCalendar data={fcCalendarData} />
                )}
              </div>
            )}
          </div>

          <FiveDayForecast days={data.days} selectedDay={selectedDay} onSelectDay={setSelectedDay} />

          <p className={styles.attribution}>Data from Open-Meteo, USGS, NOAA</p>
        </>
      )}
    </div>
  );
}
