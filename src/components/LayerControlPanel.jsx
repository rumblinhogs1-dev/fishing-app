import styles from './LayerControlPanel.module.css';

const BASEMAPS = [
  { id: 'osm', label: 'Standard' },
  { id: 'satellite', label: 'Satellite' },
  { id: 'ocean', label: 'Ocean' },
];

const BATHY_OVERLAYS = [
  { key: 'depthContours', label: 'Depth Contours', desc: 'Esri Ocean + navigation marks' },
  { key: 'openSeaBathy', label: 'OpenSeaMap Bathymetry', desc: 'Crowdsourced depth data' },
  { key: 'navionics', label: 'Navionics SonarChart', desc: import.meta.env.VITE_NAVIONICS_KEY ? 'HD lake & ocean contours' : 'Requires VITE_NAVIONICS_KEY' },
];

const MAP_OVERLAYS = [
  { key: 'noaaCharts', label: 'NOAA Nautical Charts' },
  { key: 'usgsTopo', label: 'USGS Topo' },
  { key: 'publicLands', label: 'Public/Private Land' },
];

const DATA_OVERLAYS = [
  { key: 'catchPins', label: 'Catch Pins' },
  { key: 'favoriteSpots', label: 'Favorite Spots' },
  { key: 'heatmap', label: 'Heatmap' },
  { key: 'usgsGauges', label: 'USGS Gauges' },
  { key: 'sonarData', label: 'My Sonar Data' },
  { key: 'stockingSchedule', label: 'AZ Stocking' },
];

export default function LayerControlPanel({ layers, onToggle, onBasemap, onClose }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Map Layers</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <div className={styles.section}>
          <span className={styles.sectionLabel}>Base Map</span>
          <div className={styles.basemapRow}>
            {BASEMAPS.map((bm) => (
              <button
                key={bm.id}
                className={`${styles.basemapBtn} ${layers.basemap === bm.id ? styles.basemapActive : ''}`}
                onClick={() => onBasemap(bm.id)}
              >
                {bm.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <span className={styles.sectionLabel}>Bathymetry & Depth</span>
          {BATHY_OVERLAYS.map(({ key, label, desc }) => (
            <div key={key} className={styles.toggleRow}>
              <div className={styles.toggleInfo}>
                <span className={styles.toggleLabel}>{label}</span>
                {desc && <span className={styles.toggleDesc}>{desc}</span>}
              </div>
              <button
                className={`${styles.toggleSwitch} ${layers[key] ? styles.toggleOn : ''}`}
                onClick={() => onToggle(key)}
                aria-label={`Toggle ${label}`}
              >
                <span className={styles.toggleKnob} />
              </button>
            </div>
          ))}
        </div>

        <div className={styles.section}>
          <span className={styles.sectionLabel}>Map Overlays</span>
          {MAP_OVERLAYS.map(({ key, label }) => (
            <div key={key} className={styles.toggleRow}>
              <span className={styles.toggleLabel}>{label}</span>
              <button
                className={`${styles.toggleSwitch} ${layers[key] ? styles.toggleOn : ''}`}
                onClick={() => onToggle(key)}
                aria-label={`Toggle ${label}`}
              >
                <span className={styles.toggleKnob} />
              </button>
            </div>
          ))}
        </div>

        <div className={styles.section}>
          <span className={styles.sectionLabel}>Data Overlays</span>
          {DATA_OVERLAYS.map(({ key, label }) => (
            <div key={key} className={styles.toggleRow}>
              <span className={styles.toggleLabel}>{label}</span>
              <button
                className={`${styles.toggleSwitch} ${layers[key] ? styles.toggleOn : ''}`}
                onClick={() => onToggle(key)}
                aria-label={`Toggle ${label}`}
              >
                <span className={styles.toggleKnob} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
