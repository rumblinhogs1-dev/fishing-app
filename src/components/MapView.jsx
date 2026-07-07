import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { markStepComplete } from '../utils/onboarding';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { Link, useSearchParams } from 'react-router-dom';
import { useSpots } from '../hooks/useSpots';
import { useDepthPoints } from '../hooks/useDepthPoints';
import { useMapLayers } from '../hooks/useMapLayers';
import { useAuth } from '../contexts/AuthContext';
import { fetchCommunityHeatmapData } from '../utils/firestore';
import { fetchStockingData, getCurrentWeekStocking } from '../utils/stockingData';
import { getAvailableStates } from '../config/stockingStates';
import { getGPSLocation, geocodeLocation } from '../utils/weather';
import { fetchUSGSStations } from '../utils/usgs';
import SaveSpotModal from './SaveSpotModal';
import LayerControlPanel from './LayerControlPanel';
import StructureHintsPanel from './StructureHintsPanel';
import WaterBodyInfoPanel from './WaterBodyInfoPanel';
import CommunityHeatPanel from './CommunityHeatPanel';
import styles from './MapView.module.css';

const US_CENTER = [39.8283, -98.5795];
const DEFAULT_ZOOM = 5;
const LOCATED_ZOOM = 12;

const BASEMAP_URLS = {
  osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  ocean: 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}',
};

const BASEMAP_ATTR = {
  osm: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  satellite: '&copy; Esri',
  ocean: '&copy; Esri',
};

const SPECIES_COLORS = {
  bass: '#2e7d32',
  trout: '#1565c0',
  catfish: '#6a1b9a',
  crappie: '#e65100',
  walleye: '#f9a825',
  pike: '#00695c',
  salmon: '#d84315',
  panfish: '#0097a7',
  carp: '#795548',
};

function getSpeciesColor(species) {
  if (!species) return '#2d6a4f';
  const lower = species.toLowerCase();
  for (const [key, color] of Object.entries(SPECIES_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return '#2d6a4f';
}

function createWaterBodyIcon(count) {
  const size = Math.min(40, 28 + Math.floor(count / 5) * 2);
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:#2d6a4f;border:3px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
      color:#fff;font-weight:700;font-size:${size > 32 ? 13 : 11}px;
    ">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 2)],
  });
}

function createCatchIcon(species) {
  const color = getSpeciesColor(species);
  return L.divIcon({
    className: '',
    html: `<div style="
      width:32px;height:32px;border-radius:50%;
      background:${color};border:3px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
    "><svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
      <path d="M12 2C6.5 2 2 4 2 7c0 2 2 4 5 5l-1 4 3-2c1 .3 2 .5 3 .5s2-.2 3-.5l3 2-1-4c3-1 5-3 5-5 0-3-4.5-5-10-5z"/>
    </svg></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
}

const spotIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:36px;height:36px;border-radius:50%;
    background:#d4a017;border:3px solid #fff;
    box-shadow:0 2px 6px rgba(0,0,0,0.3);
    display:flex;align-items:center;justify-content:center;
  "><svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20],
});

function createGaugeIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:28px;height:28px;border-radius:50%;
      background:#0097a7;border:2px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
    "><svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
    </svg></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

function CatchClusterLayer({ catches, onSaveSpot }) {
  const map = useMap();
  const clusterRef = useRef(null);
  const [pluginReady, setPluginReady] = useState(false);

  useEffect(() => {
    import('leaflet.markercluster').then(() => setPluginReady(true));
  }, []);

  useEffect(() => {
    if (!pluginReady) return;

    const cluster = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
    });
    clusterRef.current = cluster;

    catches.forEach((c) => {
      if (!c.lat || !c.lng) return;
      const marker = L.marker([c.lat, c.lng], { icon: createCatchIcon(c.species) });

      const img = c.imageUrl || c.image;
      const d = c.date ? new Date(c.date) : null;
      const dateStr = d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

      const popupContent = document.createElement('div');
      popupContent.className = styles.popup;

      if (img) {
        const imgEl = document.createElement('img');
        imgEl.src = img;
        imgEl.className = styles.popupImg;
        imgEl.alt = c.species || 'Catch';
        popupContent.appendChild(imgEl);
      }

      const body = document.createElement('div');
      body.className = styles.popupBody;

      const speciesEl = document.createElement('strong');
      speciesEl.className = styles.popupSpecies;
      speciesEl.textContent = c.species || 'Unknown';
      body.appendChild(speciesEl);

      const meta = document.createElement('div');
      meta.className = styles.popupMeta;
      if (c.weight) { const s = document.createElement('span'); s.textContent = `${c.weight} lbs`; meta.appendChild(s); }
      if (c.length) { const s = document.createElement('span'); s.textContent = `${c.length} in`; meta.appendChild(s); }
      if (c.depth) { const s = document.createElement('span'); s.textContent = `${c.depth} ft deep`; meta.appendChild(s); }
      body.appendChild(meta);

      if (dateStr) {
        const dateEl = document.createElement('div');
        dateEl.className = styles.popupDate;
        dateEl.textContent = dateStr;
        body.appendChild(dateEl);
      }

      if (c.weather) {
        const weatherEl = document.createElement('div');
        weatherEl.className = styles.popupWeather;
        weatherEl.textContent = c.weather;
        body.appendChild(weatherEl);
      }

      const actions = document.createElement('div');
      actions.className = styles.popupActions;
      const link = document.createElement('a');
      link.href = `/catch/${c.id}`;
      link.className = styles.popupLink;
      link.textContent = 'View Full Entry';
      actions.appendChild(link);
      const btn = document.createElement('button');
      btn.className = styles.popupSaveBtn;
      btn.dataset.lat = c.lat;
      btn.dataset.lng = c.lng;
      btn.dataset.species = c.species || '';
      btn.textContent = 'Save This Spot';
      actions.appendChild(btn);
      body.appendChild(actions);

      popupContent.appendChild(body);

      marker.bindPopup(popupContent, { maxWidth: 260, minWidth: 200 });
      cluster.addLayer(marker);
    });

    map.addLayer(cluster);

    function handlePopupOpen(e) {
      const btn = e.popup.getElement()?.querySelector(`.${styles.popupSaveBtn}`);
      if (btn) {
        btn.addEventListener('click', () => {
          const lat = parseFloat(btn.dataset.lat);
          const lng = parseFloat(btn.dataset.lng);
          const species = btn.dataset.species;
          onSaveSpot(lat, lng, species);
        });
      }
    }
    map.on('popupopen', handlePopupOpen);

    return () => {
      map.off('popupopen', handlePopupOpen);
      map.removeLayer(cluster);
    };
  }, [map, catches, onSaveSpot, pluginReady]);

  return null;
}

function HeatLayer({ catches, communityPoints }) {
  const map = useMap();
  const [pluginReady, setPluginReady] = useState(false);

  useEffect(() => {
    import('leaflet.heat').then(() => setPluginReady(true));
  }, []);

  useEffect(() => {
    if (!pluginReady) return;

    const points = catches
      .filter((c) => c.lat && c.lng)
      .map((c) => [c.lat, c.lng, 0.5]);

    if (communityPoints?.length) {
      communityPoints.forEach((p) => points.push([p.lat, p.lng, 0.3]));
    }

    if (points.length === 0) return;

    const heat = L.heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      gradient: { 0.2: '#1b4332', 0.4: '#2d6a4f', 0.6: '#43a047', 0.8: '#f9a825', 1.0: '#d32f2f' },
    });
    map.addLayer(heat);
    return () => map.removeLayer(heat);
  }, [map, catches, communityPoints, pluginReady]);

  return null;
}

function DepthContourLayer() {
  return (
    <>
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}"
        attribution="&copy; Esri"
        opacity={0.6}
        zIndex={2}
      />
      <TileLayer
        url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"
        attribution="&copy; OpenSeaMap"
        opacity={0.7}
        zIndex={3}
      />
    </>
  );
}

function NavionicsLayer() {
  const map = useMap();
  const overlayRef = useRef(null);

  useEffect(() => {
    const navKey = import.meta.env.VITE_NAVIONICS_KEY;
    if (!navKey) return;

    function createOverlay() {
      if (!window.JNC) return;
      const overlay = new window.JNC.Leaflet.NavionicsOverlay({
        navKey,
        chartType: window.JNC.NAVIONICS_CHARTS.SONAR,
        isTransparent: true,
        zIndex: 5,
      });
      overlay.addTo(map);
      overlayRef.current = overlay;
    }

    if (window.JNC) {
      createOverlay();
      return () => {
        if (overlayRef.current) map.removeLayer(overlayRef.current);
      };
    }

    const existing = document.querySelector('script[src*="navionics"]');
    if (existing) {
      existing.addEventListener('load', createOverlay);
      return () => {
        if (overlayRef.current) map.removeLayer(overlayRef.current);
      };
    }

    const script = document.createElement('script');
    script.src = 'https://webapiv2.navionics.com/dist/webapi/webapi.min.no-dep.js';
    script.async = true;
    script.onload = createOverlay;
    document.head.appendChild(script);

    return () => {
      if (overlayRef.current) map.removeLayer(overlayRef.current);
    };
  }, [map]);

  return null;
}

function USGSGaugeLayer() {
  const map = useMap();
  const [stations, setStations] = useState([]);
  const timerRef = useRef(null);
  const gaugeIcon = useMemo(() => createGaugeIcon(), []);

  const loadStations = useCallback(() => {
    const zoom = map.getZoom();
    if (zoom < 8) {
      setStations([]);
      return;
    }
    const bounds = map.getBounds();
    fetchUSGSStations({
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    })
      .then(setStations)
      .catch(() => setStations([]));
  }, [map]);

  useMapEvents({
    moveend() {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(loadStations, 500);
    },
  });

  useEffect(() => {
    loadStations();
    return () => clearTimeout(timerRef.current);
  }, [loadStations]);

  return (
    <>
      {stations.map((s) => (
        <Marker key={s.siteId} position={[s.lat, s.lng]} icon={gaugeIcon}>
          <Popup>
            <div className={styles.gaugePopup}>
              <strong>{s.siteName}</strong>
              {s.gaugeHeight != null && <div>Gauge Height: {s.gaugeHeight} ft</div>}
              {s.waterTemp != null && <div>Water Temp: {s.waterTemp}°F</div>}
              {s.flowRate != null && <div>Flow Rate: {s.flowRate} ft³/s</div>}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

function RecenterButton({ userLocation }) {
  const map = useMap();

  function handleClick() {
    if (userLocation) {
      map.flyTo(userLocation, LOCATED_ZOOM);
    }
  }

  return (
    <button className={styles.recenterBtn} onClick={handleClick} title="Re-center on your location">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
      </svg>
    </button>
  );
}

function AutoCenter({ userLocation }) {
  const map = useMap();
  const centered = useRef(false);
  useEffect(() => {
    if (userLocation && !centered.current) {
      centered.current = true;
      map.flyTo(userLocation, LOCATED_ZOOM);
    }
  }, [map, userLocation]);
  return null;
}

function depthColor(depth, minD, maxD) {
  const range = maxD - minD || 1;
  const t = Math.min(1, Math.max(0, (depth - minD) / range));
  const r = Math.round(79 + (13 - 79) * t);
  const g = Math.round(195 + (71 - 195) * t);
  const b = Math.round(247 + (161 - 247) * t);
  return `rgb(${r},${g},${b})`;
}

function SonarDataLayer({ depthPoints }) {
  const map = useMap();

  useEffect(() => {
    if (!depthPoints.length) return;

    const depths = depthPoints.map((p) => p.depth);
    const minD = Math.min(...depths);
    const maxD = Math.max(...depths);

    const markers = depthPoints.map((p) =>
      L.circleMarker([p.lat, p.lng], {
        radius: 4,
        fillColor: depthColor(p.depth, minD, maxD),
        fillOpacity: 0.8,
        color: '#fff',
        weight: 0.5,
      }).bindPopup(
        `<b>${p.depth} ft</b>${p.waterTemp != null ? `<br/>Temp: ${p.waterTemp}°F` : ''}`
      )
    );

    const group = L.featureGroup(markers).addTo(map);
    return () => map.removeLayer(group);
  }, [map, depthPoints]);

  return null;
}

const stockingIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:30px;height:30px;border-radius:50%;
    background:#e65100;border:3px solid #fff;
    box-shadow:0 2px 6px rgba(0,0,0,0.3);
    display:flex;align-items:center;justify-content:center;
  "><svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
    <path d="M12 2C6.5 2 2 4 2 7c0 2 2 4 5 5l-1 4 3-2c1 .3 2 .5 3 .5s2-.2 3-.5l3 2-1-4c3-1 5-3 5-5 0-3-4.5-5-10-5z"/>
  </svg></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -17],
});

const highlightIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:36px;height:36px;border-radius:50%;
    background:#2d6a4f;border:3px solid #fff;
    box-shadow:0 0 0 4px rgba(45,106,79,0.35), 0 2px 8px rgba(0,0,0,0.3);
    display:flex;align-items:center;justify-content:center;
  "><svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
  </svg></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

function HighlightMarker({ position, label }) {
  return (
    <Marker position={position} icon={highlightIcon}>
      <Popup>{label}</Popup>
    </Marker>
  );
}

function StockingLayer() {
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    const states = getAvailableStates();

    Promise.all(
      states.map(async (stateConfig) => {
        const entries = await fetchStockingData({
          sheets: stateConfig.sheets,
          cacheKey: stateConfig.cacheKey,
          format: stateConfig.format,
        });
        const current = getCurrentWeekStocking(entries);

        // Dedupe by water body and merge species
        const waterMap = new Map();
        current.forEach((e) => {
          const key = e.waterBody.toLowerCase();
          if (!waterMap.has(key)) {
            waterMap.set(key, { ...e, species: [...e.species], stateCode: stateConfig.code });
          } else {
            const existing = waterMap.get(key);
            e.species.forEach((s) => {
              if (!existing.species.includes(s)) existing.species.push(s);
            });
          }
        });

        // Resolve coordinates via dynamic import
        const coordModule = await stateConfig.getCoordinates();
        const getCoords = coordModule.getWaterCoordinates;
        const pins = [];
        waterMap.forEach((entry) => {
          const coords = getCoords(entry.waterBody);
          if (coords) {
            pins.push({ ...entry, lat: coords.lat, lng: coords.lng });
          }
        });
        return pins;
      })
    )
      .then((allPins) => setMarkers(allPins.flat()))
      .catch(() => setMarkers([]));
  }, []);

  return (
    <>
      {markers.map((m) => (
        <Marker key={`${m.stateCode}-${m.waterBody}`} position={[m.lat, m.lng]} icon={stockingIcon}>
          <Popup>
            <div style={{ fontSize: '0.85rem' }}>
              <strong style={{ color: '#e65100' }}>{m.waterBody}</strong>
              <div style={{ margin: '0.25rem 0', color: '#555' }}>
                Stocked: {m.species.join(', ')}
              </div>
              {m.region && <div style={{ fontSize: '0.75rem', color: '#888' }}>{m.region}</div>}
              <Link to={`/stocking/${m.stateCode}`} style={{ fontSize: '0.75rem', color: '#2d6a4f' }}>
                View Full Schedule
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

function MapCenterTracker({ onCenterChange }) {
  useMapEvents({
    moveend(e) {
      const c = e.target.getCenter();
      onCenterChange({ lat: c.lat, lng: c.lng });
    },
  });
  return null;
}

function MapRefSetter({ onMap }) {
  const map = useMap();
  useEffect(() => { onMap(map); }, [map, onMap]);
  return null;
}

function LocationSearch({ mapRef }) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  async function handleSearch() {
    const trimmed = query.trim();
    if (!trimmed || !mapRef.current) return;
    setError('');
    setSearching(true);
    try {
      const result = await geocodeLocation(trimmed);
      mapRef.current.flyTo([result.lat, result.lng], 13);
    } catch {
      setError('Location not found');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSearching(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSearch();
  }

  return (
    <div className={styles.searchBox}>
      <div className={styles.searchInputWrap}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search lake, river, or place..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={searching}
        />
        {query && (
          <button
            className={styles.searchClear}
            onClick={() => { setQuery(''); setError(''); }}
            title="Clear"
          >
            &times;
          </button>
        )}
        <button
          className={styles.searchBtn}
          onClick={handleSearch}
          disabled={searching || !query.trim()}
          title="Search"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
        </button>
      </div>
      {error && <div className={styles.searchError}>{error}</div>}
    </div>
  );
}

export default function MapView({ catches = [] }) {
  useEffect(() => { markStepComplete('exploredMap'); }, []);
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { spots, addSpot } = useSpots();
  const { depthPoints } = useDepthPoints();
  const { layers, toggleLayer, setBasemap } = useMapLayers();
  const [userLocation, setUserLocation] = useState(null);

  // Check for deep-link params (?lat=X&lng=Y&zoom=Z&label=Name)
  const deepLink = useMemo(() => {
    const lat = parseFloat(searchParams.get('lat'));
    const lng = parseFloat(searchParams.get('lng'));
    if (isNaN(lat) || isNaN(lng)) return null;
    return {
      lat,
      lng,
      zoom: parseInt(searchParams.get('zoom'), 10) || 13,
      label: searchParams.get('label') || '',
    };
  }, [searchParams]);

  const [center, setCenter] = useState(deepLink ? [deepLink.lat, deepLink.lng] : US_CENTER);
  const [zoom, setZoom] = useState(deepLink ? deepLink.zoom : DEFAULT_ZOOM);
  const [spotModal, setSpotModal] = useState(null);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [showStructure, setShowStructure] = useState(false);
  const [showWaterInfo, setShowWaterInfo] = useState(false);
  const [mapCenter, setMapCenter] = useState(
    deepLink ? { lat: deepLink.lat, lng: deepLink.lng } : { lat: US_CENTER[0], lng: US_CENTER[1] }
  );
  const [communityData, setCommunityData] = useState({ waterBodyAggregates: [], heatPoints: [] });
  const [showHeatPanel, setShowHeatPanel] = useState(false);
  const mapInstanceRef = useRef(null);

  const catchesWithCoords = useMemo(
    () => catches.filter((c) => c.lat && c.lng),
    [catches]
  );

  useEffect(() => {
    if (!layers.heatmap) return;
    fetchCommunityHeatmapData(user?.uid)
      .then(setCommunityData)
      .catch(() => setCommunityData({ waterBodyAggregates: [], heatPoints: [] }));
  }, [layers.heatmap, user?.uid]);

  useEffect(() => {
    // Skip GPS override when arriving via deep link
    if (deepLink) return;

    getGPSLocation()
      .then((loc) => {
        setUserLocation([loc.lat, loc.lng]);
        setCenter([loc.lat, loc.lng]);
        setZoom(LOCATED_ZOOM);
        setMapCenter({ lat: loc.lat, lng: loc.lng });
      })
      .catch(() => {
        if (catchesWithCoords.length > 0) {
          const first = catchesWithCoords[0];
          setCenter([first.lat, first.lng]);
          setZoom(LOCATED_ZOOM);
          setMapCenter({ lat: first.lat, lng: first.lng });
        }
      });
  }, [catchesWithCoords, deepLink]);

  const handleSaveSpot = useCallback((lat, lng, species) => {
    setSpotModal({ lat, lng, defaultName: species ? `${species} Spot` : '' });
  }, []);

  async function handleSpotSave(data) {
    await addSpot(data);
  }

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <span className={styles.badge}>
          {catchesWithCoords.length} catch{catchesWithCoords.length !== 1 ? 'es' : ''}
        </span>
      </div>

      <LocationSearch mapRef={mapInstanceRef} />

      <MapContainer center={center} zoom={zoom} className={styles.map} zoomControl={false}>
        <TileLayer
          key={layers.basemap}
          attribution={BASEMAP_ATTR[layers.basemap]}
          url={BASEMAP_URLS[layers.basemap]}
        />

        {layers.depthContours && <DepthContourLayer />}

        {layers.openSeaBathy && (
          <TileLayer
            url="https://depth.openseamap.org/tiles/{z}/{x}/{y}.png"
            attribution="&copy; OpenSeaMap Bathymetry"
            opacity={0.7}
            zIndex={3}
          />
        )}

        {layers.navionics && <NavionicsLayer />}

        {layers.noaaCharts && (
          <TileLayer
            url="https://gis.charttools.noaa.gov/arcgis/rest/services/MarineChart_Services/NOAACharts/MapServer/WMTS/tile/1.0.0/MarineChart_Services_NOAACharts/default/GoogleMapsCompatible/{z}/{y}/{x}.png"
            attribution="&copy; NOAA Chart Display Service"
            opacity={0.7}
            zIndex={4}
          />
        )}

        {layers.usgsTopo && (
          <TileLayer
            url="https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}"
            attribution="&copy; USGS"
            opacity={0.6}
            zIndex={4}
          />
        )}

        {layers.publicLands && (
          <TileLayer
            url="https://gis.blm.gov/arcgis/rest/services/lands/BLM_Natl_SMA_Cached_with_PriUnk/MapServer/tile/{z}/{y}/{x}"
            attribution="&copy; BLM Surface Management Agency"
            opacity={0.5}
            zIndex={4}
          />
        )}

        {layers.catchPins && (
          <CatchClusterLayer catches={catchesWithCoords} onSaveSpot={handleSaveSpot} />
        )}
        {layers.heatmap && <HeatLayer catches={catchesWithCoords} communityPoints={communityData.heatPoints} />}

        {layers.heatmap && communityData.waterBodyAggregates.map((wb) => (
          <Marker
            key={wb.waterBody}
            position={[wb.lat, wb.lng]}
            icon={createWaterBodyIcon(wb.totalCatches)}
          >
            <Popup>
              <div className={styles.popup}>
                <strong style={{ color: '#2d6a4f', fontSize: '0.95rem', display: 'block', marginBottom: '0.25rem' }}>
                  {wb.waterBody}
                </strong>
                <div style={{ fontSize: '0.8rem', color: '#555', marginBottom: '0.3rem' }}>
                  {wb.totalCatches} catch{wb.totalCatches !== 1 ? 'es' : ''} shared
                </div>
                {wb.species.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                    {wb.species.slice(0, 5).map((s) => (
                      <span key={s.name} style={{
                        background: '#e8f5e9', color: '#2e7d32',
                        padding: '0.1rem 0.4rem', borderRadius: '8px',
                        fontSize: '0.72rem', fontWeight: 500,
                      }}>
                        {s.name} ({s.count})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {layers.favoriteSpots && spots.map((spot) => (
          <Marker key={spot.id} position={[spot.lat, spot.lng]} icon={spotIcon}>
            <Popup>
              <div className={styles.spotPopup}>
                <strong>{spot.name}</strong>
                {spot.notes && <p>{spot.notes}</p>}
                <Link to="/spots" className={styles.popupLink}>View My Spots</Link>
              </div>
            </Popup>
          </Marker>
        ))}

        {layers.usgsGauges && <USGSGaugeLayer />}

        {layers.sonarData && depthPoints.length > 0 && (
          <SonarDataLayer depthPoints={depthPoints} />
        )}

        {layers.stockingSchedule && <StockingLayer />}

        {deepLink && (
          <HighlightMarker position={[deepLink.lat, deepLink.lng]} label={deepLink.label} />
        )}

        <MapCenterTracker onCenterChange={setMapCenter} />
        <AutoCenter userLocation={userLocation} />
        <RecenterButton userLocation={userLocation} />
        <MapRefSetter onMap={useCallback((m) => { mapInstanceRef.current = m; }, [])} />
      </MapContainer>

      {/* Floating buttons */}
      <button
        className={styles.waterInfoBtn}
        onClick={() => setShowWaterInfo(true)}
        title="Water Body Info"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2C20 10.48 17.33 6.55 12 2zm0 18c-3.35 0-6-2.57-6-6.2 0-2.34 1.95-5.44 6-9.14 4.05 3.7 6 6.79 6 9.14 0 3.63-2.65 6.2-6 6.2z"/>
        </svg>
      </button>

      <button
        className={styles.structureBtn}
        onClick={() => setShowStructure(true)}
        title="Find Structure & Hotspots"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 6l-3.75 5 2.85 3.8-1.6 1.2C9.81 13.75 7 10 7 10l-6 8h22L14 6z"/>
        </svg>
      </button>

      {layers.heatmap && (
        <button
          className={styles.heatPanelBtn}
          onClick={() => setShowHeatPanel(true)}
          title="Community Activity"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
          </svg>
        </button>
      )}

      <button
        className={styles.layerBtn}
        onClick={() => setShowLayerPanel(true)}
        title="Map Layers"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z"/>
        </svg>
      </button>

      {showLayerPanel && (
        <LayerControlPanel
          layers={layers}
          onToggle={toggleLayer}
          onBasemap={setBasemap}
          onClose={() => setShowLayerPanel(false)}
        />
      )}

      {showStructure && (
        <StructureHintsPanel
          lat={mapCenter.lat}
          lng={mapCenter.lng}
          onClose={() => setShowStructure(false)}
        />
      )}

      {showHeatPanel && (
        <CommunityHeatPanel
          waterBodyAggregates={communityData.waterBodyAggregates}
          heatPoints={communityData.heatPoints}
          onClose={() => setShowHeatPanel(false)}
        />
      )}

      {showWaterInfo && (
        <WaterBodyInfoPanel
          lat={mapCenter.lat}
          lng={mapCenter.lng}
          onClose={() => setShowWaterInfo(false)}
        />
      )}

      {spotModal && user && (
        <SaveSpotModal
          lat={spotModal.lat}
          lng={spotModal.lng}
          defaultName={spotModal.defaultName}
          onSave={handleSpotSave}
          onClose={() => setSpotModal(null)}
        />
      )}

      {spotModal && !user && (
        <div className={styles.signInOverlay} onClick={() => setSpotModal(null)}>
          <div className={styles.signInCard} onClick={(e) => e.stopPropagation()}>
            <p>Sign in to save fishing spots.</p>
            <Link to="/auth" className={styles.signInLink}>Sign In</Link>
            <button className={styles.cancelBtn} onClick={() => setSpotModal(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
