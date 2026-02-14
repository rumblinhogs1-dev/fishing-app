import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import 'leaflet.heat';
import { Link } from 'react-router-dom';
import { useSpots } from '../hooks/useSpots';
import { useAuth } from '../contexts/AuthContext';
import { getGPSLocation } from '../utils/weather';
import SaveSpotModal from './SaveSpotModal';
import styles from './MapView.module.css';

const US_CENTER = [39.8283, -98.5795];
const DEFAULT_ZOOM = 5;
const LOCATED_ZOOM = 12;

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
  if (!species) return '#1a73e8';
  const lower = species.toLowerCase();
  for (const [key, color] of Object.entries(SPECIES_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return '#1a73e8';
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

function CatchClusterLayer({ catches, onSaveSpot }) {
  const map = useMap();
  const clusterRef = useRef(null);

  useEffect(() => {
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
      popupContent.innerHTML = `
        ${img ? `<img src="${img}" class="${styles.popupImg}" alt="${c.species || 'Catch'}" />` : ''}
        <div class="${styles.popupBody}">
          <strong class="${styles.popupSpecies}">${c.species || 'Unknown'}</strong>
          <div class="${styles.popupMeta}">
            ${c.weight ? `<span>${c.weight} lbs</span>` : ''}
            ${c.length ? `<span>${c.length} in</span>` : ''}
          </div>
          ${dateStr ? `<div class="${styles.popupDate}">${dateStr}</div>` : ''}
          ${c.weather ? `<div class="${styles.popupWeather}">${c.weather}</div>` : ''}
          <div class="${styles.popupActions}">
            <a href="/catch/${c.id}" class="${styles.popupLink}">View Full Entry</a>
            <button class="${styles.popupSaveBtn}" data-lat="${c.lat}" data-lng="${c.lng}" data-species="${c.species || ''}">Save This Spot</button>
          </div>
        </div>
      `;

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
  }, [map, catches, onSaveSpot]);

  return null;
}

function HeatLayer({ catches }) {
  const map = useMap();

  useEffect(() => {
    const points = catches
      .filter((c) => c.lat && c.lng)
      .map((c) => [c.lat, c.lng, 0.5]);

    if (points.length === 0) return;

    const heat = L.heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      gradient: { 0.2: '#0d47a1', 0.4: '#1a73e8', 0.6: '#43a047', 0.8: '#f9a825', 1.0: '#d32f2f' },
    });
    map.addLayer(heat);
    return () => map.removeLayer(heat);
  }, [map, catches]);

  return null;
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

export default function MapView({ catches }) {
  const { user } = useAuth();
  const { spots, addSpot } = useSpots();
  const [view, setView] = useState('pins');
  const [userLocation, setUserLocation] = useState(null);
  const [center, setCenter] = useState(US_CENTER);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [spotModal, setSpotModal] = useState(null);

  const catchesWithCoords = useMemo(
    () => catches.filter((c) => c.lat && c.lng),
    [catches]
  );

  useEffect(() => {
    getGPSLocation()
      .then((loc) => {
        setUserLocation([loc.lat, loc.lng]);
        setCenter([loc.lat, loc.lng]);
        setZoom(LOCATED_ZOOM);
      })
      .catch(() => {
        if (catchesWithCoords.length > 0) {
          const first = catchesWithCoords[0];
          setCenter([first.lat, first.lng]);
          setZoom(LOCATED_ZOOM);
        }
      });
  }, [catchesWithCoords]);

  const handleSaveSpot = useCallback((lat, lng, species) => {
    setSpotModal({ lat, lng, defaultName: species ? `${species} Spot` : '' });
  }, []);

  async function handleSpotSave(data) {
    await addSpot(data);
  }

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <div className={styles.toggleGroup}>
          <button
            className={`${styles.toggleBtn} ${view === 'pins' ? styles.toggleActive : ''}`}
            onClick={() => setView('pins')}
          >
            Pins
          </button>
          <button
            className={`${styles.toggleBtn} ${view === 'heat' ? styles.toggleActive : ''}`}
            onClick={() => setView('heat')}
          >
            Heatmap
          </button>
        </div>
        <span className={styles.badge}>
          {catchesWithCoords.length} catch{catchesWithCoords.length !== 1 ? 'es' : ''}
        </span>
      </div>

      <MapContainer center={center} zoom={zoom} className={styles.map} zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {view === 'pins' && (
          <CatchClusterLayer catches={catchesWithCoords} onSaveSpot={handleSaveSpot} />
        )}
        {view === 'heat' && <HeatLayer catches={catchesWithCoords} />}

        {spots.map((spot) => (
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

        <RecenterButton userLocation={userLocation} />
      </MapContainer>

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
