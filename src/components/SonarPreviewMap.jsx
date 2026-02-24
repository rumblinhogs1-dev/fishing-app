import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './SonarPreviewMap.module.css';

function depthColor(depth, minDepth, maxDepth) {
  const range = maxDepth - minDepth || 1;
  const t = Math.min(1, Math.max(0, (depth - minDepth) / range));
  // Shallow light blue (#4fc3f7) → deep navy (#0d47a1)
  const r = Math.round(79 + (13 - 79) * t);
  const g = Math.round(195 + (71 - 195) * t);
  const b = Math.round(247 + (161 - 247) * t);
  return `rgb(${r},${g},${b})`;
}

export default function SonarPreviewMap({ points }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || points.length === 0) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(containerRef.current, { zoomControl: true, attributionControl: false });
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    const depths = points.map((p) => p.depth);
    const minDepth = Math.min(...depths);
    const maxDepth = Math.max(...depths);

    const markers = points.map((p) =>
      L.circleMarker([p.lat, p.lng], {
        radius: 4,
        fillColor: depthColor(p.depth, minDepth, maxDepth),
        fillOpacity: 0.8,
        color: '#fff',
        weight: 0.5,
      }).bindPopup(
        `<b>${p.depth} ft</b>${p.waterTemp !== null ? `<br/>Temp: ${p.waterTemp}°F` : ''}`
      )
    );

    const group = L.featureGroup(markers).addTo(map);
    map.fitBounds(group.getBounds().pad(0.1));

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [points]);

  return <div ref={containerRef} className={styles.container} />;
}
