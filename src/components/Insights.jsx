import { useState, useMemo, useEffect, useRef } from 'react';
import { SkeletonStats } from './Skeleton';
import styles from './Insights.module.css';

const TABS = ['Records', 'Best Conditions', 'Species', 'Trends', 'Lures', 'Locations', 'Time of Day'];
const COLORS = ['#1a73e8', '#4caf50', '#ff9800', '#e91e63', '#9c27b0', '#00bcd4', '#ff5722', '#607d8b', '#795548', '#3f51b5'];

function drawBar(ctx, data, width, height) {
  if (!data.length) return;
  const padding = { top: 20, right: 10, bottom: 30, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const max = Math.max(...data.map((d) => d.value), 1);
  const barW = Math.min(chartW / data.length - 4, 40);

  ctx.clearRect(0, 0, width, height);
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';

  data.forEach((d, i) => {
    const x = padding.left + (chartW / data.length) * i + (chartW / data.length - barW) / 2;
    const barH = (d.value / max) * chartH;
    const y = padding.top + chartH - barH;

    const grad = ctx.createLinearGradient(x, y, x, y + barH);
    grad.addColorStop(0, '#1a73e8');
    grad.addColorStop(1, '#4caf50');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, [3, 3, 0, 0]);
    ctx.fill();

    ctx.fillStyle = '#888';
    ctx.fillText(d.label, x + barW / 2, height - 8);

    ctx.fillStyle = '#1a73e8';
    ctx.fillText(d.value, x + barW / 2, y - 4);
  });
}

function drawLine(ctx, datasets, width, height) {
  if (!datasets.length || !datasets[0].points.length) return;
  const padding = { top: 20, right: 10, bottom: 30, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const allVals = datasets.flatMap((ds) => ds.points.map((p) => p.value));
  const max = Math.max(...allVals, 1);
  const labels = datasets[0].points.map((p) => p.label);

  ctx.clearRect(0, 0, width, height);
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';

  labels.forEach((label, i) => {
    const x = padding.left + (chartW / (labels.length - 1 || 1)) * i;
    ctx.fillStyle = '#888';
    ctx.fillText(label, x, height - 8);
  });

  datasets.forEach((ds, di) => {
    ctx.strokeStyle = COLORS[di % COLORS.length];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ds.points.forEach((p, i) => {
      const x = padding.left + (chartW / (labels.length - 1 || 1)) * i;
      const y = padding.top + chartH - (p.value / max) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ds.points.forEach((p, i) => {
      const x = padding.left + (chartW / (labels.length - 1 || 1)) * i;
      const y = padding.top + chartH - (p.value / max) * chartH;
      ctx.fillStyle = COLORS[di % COLORS.length];
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  });
}

function drawDonut(ctx, data, width, height) {
  if (!data.length) return;
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(cx, cy) - 20;
  const inner = radius * 0.55;
  const total = data.reduce((s, d) => s + d.value, 0);

  ctx.clearRect(0, 0, width, height);

  let startAngle = -Math.PI / 2;
  data.forEach((d, i) => {
    const sliceAngle = (d.value / total) * Math.PI * 2;
    ctx.fillStyle = COLORS[i % COLORS.length];
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
    ctx.arc(cx, cy, inner, startAngle + sliceAngle, startAngle, true);
    ctx.closePath();
    ctx.fill();

    const midAngle = startAngle + sliceAngle / 2;
    const labelR = radius + 14;
    const lx = cx + Math.cos(midAngle) * labelR;
    const ly = cy + Math.sin(midAngle) * labelR;

    if (sliceAngle > 0.2) {
      ctx.fillStyle = '#333';
      ctx.font = '11px sans-serif';
      ctx.textAlign = lx > cx ? 'left' : 'right';
      ctx.fillText(d.label, lx, ly + 4);
    }

    startAngle += sliceAngle;
  });

  ctx.fillStyle = '#333';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(total, cx, cy);
  ctx.font = '11px sans-serif';
  ctx.fillStyle = '#888';
  ctx.fillText('total', cx, cy + 16);
}

function CanvasChart({ drawFn, data, w = 600, h = 220 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    drawFn(ctx, data, w, h);
  }, [drawFn, data, w, h]);

  return (
    <div className={styles.canvasWrap}>
      <canvas ref={canvasRef} className={styles.canvas} style={{ width: w, height: h, maxWidth: '100%' }} />
    </div>
  );
}

export default function Insights({ catches }) {
  const [tab, setTab] = useState('Records');
  const [computing, setComputing] = useState(true);

  const data = useMemo(() => {
    if (!catches || catches.length === 0) return null;

    // Records
    const withWeight = catches.filter((c) => c.weight);
    const withLength = catches.filter((c) => c.length);
    const heaviest = withWeight.length ? withWeight.reduce((a, b) => (a.weight > b.weight ? a : b)) : null;
    const longest = withLength.length ? withLength.reduce((a, b) => (a.length > b.length ? a : b)) : null;

    const dateCounts = {};
    catches.forEach((c) => {
      if (c.date) {
        const day = c.date.slice(0, 10);
        dateCounts[day] = (dateCounts[day] || 0) + 1;
      }
    });
    const bestDay = Object.entries(dateCounts).sort((a, b) => b[1] - a[1])[0] || null;

    // Species
    const speciesCount = {};
    catches.forEach((c) => {
      if (c.species) {
        const s = c.species.trim().toLowerCase();
        speciesCount[s] = (speciesCount[s] || 0) + 1;
      }
    });
    const topSpecies = Object.entries(speciesCount).sort((a, b) => b[1] - a[1]);

    // Monthly trends
    const monthCount = {};
    catches.forEach((c) => {
      if (c.date) {
        const key = c.date.slice(0, 7);
        monthCount[key] = (monthCount[key] || 0) + 1;
      }
    });
    const months = Object.entries(monthCount).sort((a, b) => a[0].localeCompare(b[0]));

    // Year-over-year
    const yearMonth = {};
    catches.forEach((c) => {
      if (c.date) {
        const year = c.date.slice(0, 4);
        const month = c.date.slice(5, 7);
        if (!yearMonth[year]) yearMonth[year] = {};
        yearMonth[year][month] = (yearMonth[year][month] || 0) + 1;
      }
    });
    const years = Object.keys(yearMonth).sort();

    // Conditions
    const weatherTemps = catches.filter((c) => c.weatherTemp).map((c) => ({ temp: Number(c.weatherTemp), count: 1 }));
    const pressures = catches.filter((c) => c.weatherPressure).map((c) => Number(c.weatherPressure));
    const winds = catches.filter((c) => c.weatherWind).map((c) => Number(c.weatherWind));

    const avgTemp = weatherTemps.length ? Math.round(weatherTemps.reduce((s, t) => s + t.temp, 0) / weatherTemps.length) : null;
    const avgPressure = pressures.length ? Math.round(pressures.reduce((s, p) => s + p, 0) / pressures.length) : null;
    const avgWind = winds.length ? Math.round(winds.reduce((s, w) => s + w, 0) / winds.length * 10) / 10 : null;

    const seasonCount = { Spring: 0, Summer: 0, Fall: 0, Winter: 0 };
    catches.forEach((c) => {
      if (c.date) {
        const m = parseInt(c.date.slice(5, 7));
        if (m >= 3 && m <= 5) seasonCount.Spring++;
        else if (m >= 6 && m <= 8) seasonCount.Summer++;
        else if (m >= 9 && m <= 11) seasonCount.Fall++;
        else seasonCount.Winter++;
      }
    });

    // Lures / baits
    const lureCount = {};
    const lureBySpecies = {};
    catches.forEach((c) => {
      const lure = c.lureName || c.bait;
      if (lure) {
        const l = lure.trim();
        lureCount[l] = (lureCount[l] || 0) + 1;
        if (c.species) {
          if (!lureBySpecies[l]) lureBySpecies[l] = {};
          const s = c.species.trim().toLowerCase();
          lureBySpecies[l][s] = (lureBySpecies[l][s] || 0) + 1;
        }
      }
    });
    const topLures = Object.entries(lureCount).sort((a, b) => b[1] - a[1]).slice(0, 10);

    // Locations
    const locationCount = {};
    const locationSpecies = {};
    catches.forEach((c) => {
      if (c.location) {
        const l = c.location.trim();
        locationCount[l] = (locationCount[l] || 0) + 1;
        if (c.species) {
          if (!locationSpecies[l]) locationSpecies[l] = new Set();
          locationSpecies[l].add(c.species.trim().toLowerCase());
        }
      }
    });
    const topLocations = Object.entries(locationCount).sort((a, b) => b[1] - a[1]).slice(0, 10);

    // Time of day
    const hourCounts = new Array(24).fill(0);
    catches.forEach((c) => {
      if (c.date && c.date.length > 10) {
        const h = parseInt(c.date.slice(11, 13));
        if (!isNaN(h)) hourCounts[h]++;
      }
    });

    return {
      total: catches.length,
      heaviest,
      longest,
      bestDay,
      topSpecies,
      months,
      yearMonth,
      years,
      avgTemp,
      avgPressure,
      avgWind,
      seasonCount,
      topLures,
      lureBySpecies,
      topLocations,
      locationSpecies,
      hourCounts,
    };
  }, [catches]);

  useEffect(() => {
    setComputing(false);
  }, [data]);

  if (computing) return <div className={styles.container}><h2 className={styles.heading}>Insights</h2><SkeletonStats /></div>;

  if (!data) {
    return (
      <div className={styles.container}>
        <h2 className={styles.heading}>Insights</h2>
        <p className={styles.empty}>No data yet. Start logging catches to see insights!</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Insights</h2>

      <div className={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t}
            className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Records' && <RecordsTab data={data} />}
      {tab === 'Best Conditions' && <ConditionsTab data={data} />}
      {tab === 'Species' && <SpeciesTab data={data} />}
      {tab === 'Trends' && <TrendsTab data={data} />}
      {tab === 'Lures' && <LuresTab data={data} />}
      {tab === 'Locations' && <LocationsTab data={data} />}
      {tab === 'Time of Day' && <TimeTab data={data} />}
    </div>
  );
}

function RecordsTab({ data }) {
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Personal Bests</h3>
      <div className={styles.recordsGrid}>
        <div className={styles.recordCard}>
          <span className={styles.recordValue}>{data.total}</span>
          <span className={styles.recordLabel}>Total Catches</span>
        </div>
        {data.heaviest && (
          <div className={styles.recordCard}>
            <span className={styles.recordValue}>{data.heaviest.weight} lbs</span>
            <span className={styles.recordLabel}>Heaviest Catch</span>
            <span className={styles.recordSub}>{data.heaviest.species}</span>
          </div>
        )}
        {data.longest && (
          <div className={styles.recordCard}>
            <span className={styles.recordValue}>{data.longest.length} in</span>
            <span className={styles.recordLabel}>Longest Catch</span>
            <span className={styles.recordSub}>{data.longest.species}</span>
          </div>
        )}
        {data.bestDay && (
          <div className={styles.recordCard}>
            <span className={styles.recordValue}>{data.bestDay[1]}</span>
            <span className={styles.recordLabel}>Most in a Day</span>
            <span className={styles.recordSub}>{data.bestDay[0]}</span>
          </div>
        )}
        <div className={styles.recordCard}>
          <span className={styles.recordValue}>{data.topSpecies.length}</span>
          <span className={styles.recordLabel}>Unique Species</span>
        </div>
        <div className={styles.recordCard}>
          <span className={styles.recordValue}>{data.topLocations.length}</span>
          <span className={styles.recordLabel}>Spots Fished</span>
        </div>
      </div>
    </div>
  );
}

function ConditionsTab({ data }) {
  const bestSeason = Object.entries(data.seasonCount).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Best Conditions for Catching</h3>
      <div className={styles.conditionsGrid}>
        {data.avgTemp !== null && (
          <div className={styles.conditionCard}>
            <span className={styles.conditionValue}>{data.avgTemp}°F</span>
            <span className={styles.conditionLabel}>Avg Weather Temp</span>
          </div>
        )}
        {data.avgPressure !== null && (
          <div className={styles.conditionCard}>
            <span className={styles.conditionValue}>{data.avgPressure} mb</span>
            <span className={styles.conditionLabel}>Avg Pressure</span>
          </div>
        )}
        {data.avgWind !== null && (
          <div className={styles.conditionCard}>
            <span className={styles.conditionValue}>{data.avgWind} mph</span>
            <span className={styles.conditionLabel}>Avg Wind Speed</span>
          </div>
        )}
        {bestSeason && (
          <div className={styles.conditionCard}>
            <span className={styles.conditionValue}>{bestSeason[0]}</span>
            <span className={styles.conditionLabel}>Best Season ({bestSeason[1]} catches)</span>
          </div>
        )}
      </div>
      <h4 className={styles.subHeading}>Catches by Season</h4>
      <CanvasChart
        drawFn={(ctx, d, w, h) => drawBar(ctx, d, w, h)}
        data={Object.entries(data.seasonCount).map(([label, value]) => ({ label, value }))}
        h={200}
      />
    </div>
  );
}

function SpeciesTab({ data }) {
  const donutData = data.topSpecies.slice(0, 10).map(([label, value]) => ({ label, value }));

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Species Distribution</h3>
      <div className={styles.donutWrap}>
        <CanvasChart drawFn={(ctx, d, w, h) => drawDonut(ctx, d, w, h)} data={donutData} w={360} h={300} />
      </div>

      <h4 className={styles.subHeading}>All Species</h4>
      <ul className={styles.rankedList}>
        {data.topSpecies.map(([species, count]) => (
          <li key={species} className={styles.rankedItem}>
            <span className={styles.rankedName}>{species}</span>
            <span className={styles.rankedBadge}>{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TrendsTab({ data }) {
  const barData = data.months.map(([m, v]) => ({ label: m.slice(5), value: v }));

  const yoyDatasets = data.years.map((year) => ({
    label: year,
    points: Array.from({ length: 12 }, (_, i) => {
      const month = String(i + 1).padStart(2, '0');
      return { label: month, value: data.yearMonth[year]?.[month] || 0 };
    }),
  }));

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Monthly Catch Count</h3>
      <CanvasChart drawFn={(ctx, d, w, h) => drawBar(ctx, d, w, h)} data={barData} />

      {data.years.length > 1 && (
        <>
          <h4 className={styles.subHeading}>Year-over-Year Comparison</h4>
          <CanvasChart drawFn={(ctx, d, w, h) => drawLine(ctx, d, w, h)} data={yoyDatasets} />
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {data.years.map((y, i) => (
              <span key={y} style={{ fontSize: '0.8rem', color: COLORS[i % COLORS.length], fontWeight: 600 }}>
                {y}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function LuresTab({ data }) {
  const barData = data.topLures.slice(0, 8).map(([label, value]) => ({ label: label.length > 10 ? label.slice(0, 9) + '...' : label, value }));

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Top Lures / Baits</h3>
      {data.topLures.length === 0 ? (
        <p className={styles.empty}>No lure/bait data recorded yet.</p>
      ) : (
        <>
          <CanvasChart drawFn={(ctx, d, w, h) => drawBar(ctx, d, w, h)} data={barData} />
          <h4 className={styles.subHeading}>Lure Effectiveness by Species</h4>
          <ul className={styles.rankedList}>
            {data.topLures.map(([lure, count]) => (
              <li key={lure} className={styles.rankedItem}>
                <div>
                  <span className={styles.rankedName}>{lure}</span>
                  {data.lureBySpecies[lure] && (
                    <div style={{ fontSize: '0.75rem', color: '#888', marginTop: 2 }}>
                      {Object.entries(data.lureBySpecies[lure]).slice(0, 3).map(([sp, c]) => `${sp} (${c})`).join(', ')}
                    </div>
                  )}
                </div>
                <span className={styles.rankedBadge}>{count}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function LocationsTab({ data }) {
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Top Spots</h3>
      {data.topLocations.length === 0 ? (
        <p className={styles.empty}>No location data recorded yet.</p>
      ) : (
        <ul className={styles.rankedList}>
          {data.topLocations.map(([loc, count]) => (
            <li key={loc} className={styles.rankedItem}>
              <div>
                <span className={styles.rankedName}>{loc}</span>
                {data.locationSpecies[loc] && (
                  <div style={{ fontSize: '0.75rem', color: '#888', marginTop: 2 }}>
                    {data.locationSpecies[loc].size} unique species
                  </div>
                )}
              </div>
              <span className={styles.rankedBadge}>{count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TimeTab({ data }) {
  const barData = data.hourCounts.map((count, h) => {
    const label = h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`;
    return { label, value: count };
  });

  const nonZero = barData.filter((d) => d.value > 0);
  const bestHour = nonZero.length ? nonZero.reduce((a, b) => (a.value > b.value ? a : b)) : null;

  const slots = [
    { label: 'Dawn (5-8a)', start: 5, end: 8 },
    { label: 'Morning (8-11a)', start: 8, end: 11 },
    { label: 'Midday (11a-2p)', start: 11, end: 14 },
    { label: 'Afternoon (2-5p)', start: 14, end: 17 },
    { label: 'Evening (5-8p)', start: 17, end: 20 },
    { label: 'Night (8p-5a)', start: 20, end: 5 },
  ];

  const slotCounts = slots.map((slot) => {
    let total = 0;
    if (slot.start < slot.end) {
      for (let h = slot.start; h < slot.end; h++) total += data.hourCounts[h];
    } else {
      for (let h = slot.start; h < 24; h++) total += data.hourCounts[h];
      for (let h = 0; h < slot.end; h++) total += data.hourCounts[h];
    }
    return { label: slot.label, value: total };
  });

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Catches by Hour</h3>
      <CanvasChart drawFn={(ctx, d, w, h) => drawBar(ctx, d, w, h)} data={barData} />

      {bestHour && (
        <div className={styles.conditionsGrid} style={{ marginTop: '1rem' }}>
          <div className={styles.conditionCard}>
            <span className={styles.conditionValue}>{bestHour.label}</span>
            <span className={styles.conditionLabel}>Peak Hour ({bestHour.value} catches)</span>
          </div>
        </div>
      )}

      <h4 className={styles.subHeading}>Best Time Slots</h4>
      <CanvasChart drawFn={(ctx, d, w, h) => drawBar(ctx, d, w, h)} data={slotCounts} h={200} />
    </div>
  );
}
