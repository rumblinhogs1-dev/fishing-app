import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSpots } from '../hooks/useSpots';
import { useTackleBox } from '../hooks/useTackleBox';
import { addTrip, updateTrip, deleteTrip, subscribeToTrips, generateChecklist } from '../utils/trips';
import { getFullForecast } from '../utils/forecast';
import { getGPSLocation, reverseGeocode } from '../utils/weather';
import { SkeletonCard } from './Skeleton';
import { useToast } from '../contexts/ToastContext';
import styles from './TripPlanner.module.css';

const EMPTY_TRIP = {
  name: '',
  destination: '',
  lat: '',
  lng: '',
  date: '',
  targetSpecies: '',
};

export default function TripPlanner() {
  const { user } = useAuth();
  const { spots } = useSpots();
  const { items: tackleItems } = useTackleBox();
  const toast = useToast();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_TRIP);
  const [forecast, setForecast] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [checklist, setChecklist] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { setTrips([]); setLoading(false); return; }
    setLoading(true);
    const unsub = subscribeToTrips(user.uid, (data) => {
      setTrips(data);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  function handleSpotSelect(e) {
    const spotId = e.target.value;
    if (spotId === '__gps__') {
      getGPSLocation().then(({ latitude, longitude }) => {
        reverseGeocode(latitude, longitude).then((name) => {
          setForm((f) => ({ ...f, destination: name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, lat: latitude, lng: longitude }));
        }).catch(() => {
          setForm((f) => ({ ...f, destination: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, lat: latitude, lng: longitude }));
        });
      }).catch(() => {});
      return;
    }
    const spot = spots.find((s) => s.id === spotId);
    if (spot) {
      setForm((f) => ({ ...f, destination: spot.name, lat: spot.lat, lng: spot.lng }));
    }
  }

  async function handleFetchForecast() {
    if (!form.lat || !form.lng) return;
    setForecastLoading(true);
    try {
      const data = await getFullForecast(form.lat, form.lng);
      setForecast(data);
      const cl = generateChecklist(form.targetSpecies, data, tackleItems);
      setChecklist(cl);
    } catch (err) {
      console.error('Forecast error:', err);
    } finally {
      setForecastLoading(false);
    }
  }

  async function handleCreateTrip(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.destination.trim()) return;
    setSaving(true);
    try {
      const cl = checklist.length > 0 ? checklist : generateChecklist(form.targetSpecies, forecast, tackleItems);
      await addTrip(user.uid, {
        name: form.name.trim(),
        destination: form.destination.trim(),
        lat: form.lat || null,
        lng: form.lng || null,
        date: form.date || null,
        targetSpecies: form.targetSpecies.trim(),
        checklist: cl,
        catches: [],
      });
      toast.success('Trip saved!');
      setForm(EMPTY_TRIP);
      setChecklist([]);
      setForecast(null);
      setShowForm(false);
    } catch (err) {
      console.error('Failed to create trip:', err);
      toast.error('Failed to create trip');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleCheckItem(trip, index) {
    const updated = [...(trip.checklist || [])];
    updated[index] = { ...updated[index], packed: !updated[index].packed };
    await updateTrip(trip.id, { checklist: updated });
  }

  async function handleCompleteTrip(trip) {
    await updateTrip(trip.id, { status: 'completed' });
  }

  function toggleChecklistItem(index) {
    setChecklist((prev) => prev.map((item, i) =>
      i === index ? { ...item, packed: !item.packed } : item
    ));
  }

  if (!user) {
    return (
      <div className={styles.container}>
        <h2 className={styles.heading}>Trip Planner</h2>
        <p className={styles.empty}>Sign in to plan your fishing trips.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <h2 className={styles.heading}>Trip Planner</h2>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const planned = trips.filter((t) => t.status === 'planned');
  const completed = trips.filter((t) => t.status === 'completed');

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Trip Planner</h2>

      <button className={styles.addBtn} onClick={() => { setShowForm(!showForm); setActiveTrip(null); }}>
        {showForm ? 'Cancel' : '+ Plan a Trip'}
      </button>

      {showForm && (
        <form className={styles.form} onSubmit={handleCreateTrip}>
          <input
            className={styles.input}
            placeholder="Trip name (e.g. Weekend at Lake Fork)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            autoFocus
          />

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Destination</label>
            <select className={styles.select} onChange={handleSpotSelect} defaultValue="">
              <option value="" disabled>Pick a saved spot or use GPS</option>
              <option value="__gps__">Use Current Location (GPS)</option>
              {spots.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <input
              className={styles.input}
              placeholder="Or type a location..."
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Date & Time</label>
              <input
                type="datetime-local"
                className={styles.input}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Target Species</label>
              <input
                className={styles.input}
                placeholder="e.g. Largemouth Bass"
                value={form.targetSpecies}
                onChange={(e) => setForm({ ...form, targetSpecies: e.target.value })}
              />
            </div>
          </div>

          {form.lat && form.lng && (
            <button type="button" className={styles.forecastBtn} onClick={handleFetchForecast} disabled={forecastLoading}>
              {forecastLoading ? 'Loading forecast...' : 'Pull Forecast for This Location'}
            </button>
          )}

          {forecast && forecast.days?.[0] && (
            <div className={styles.forecastPreview}>
              <h4 className={styles.forecastTitle}>Forecast Preview</h4>
              <div className={styles.forecastGrid}>
                <span>Temp: {forecast.days[0].tempMin}° - {forecast.days[0].tempMax}°F</span>
                <span>Wind: {forecast.days[0].windMax} mph</span>
                <span>Precip: {forecast.days[0].precip}"</span>
                {forecast.days[0].biteScore && (
                  <span style={{ color: forecast.days[0].biteScore.color }}>
                    Bite Score: {forecast.days[0].biteScore.score}/10
                  </span>
                )}
              </div>
            </div>
          )}

          {checklist.length > 0 && (
            <div className={styles.checklistPreview}>
              <h4 className={styles.checklistTitle}>Suggested Packing List</h4>
              {checklist.map((item, i) => (
                <label key={i} className={styles.checkItem}>
                  <input
                    type="checkbox"
                    checked={item.packed}
                    onChange={() => toggleChecklistItem(i)}
                  />
                  <span className={item.packed ? styles.checkedText : ''}>{item.text}</span>
                  <span className={styles.checkCat}>{item.category}</span>
                </label>
              ))}
            </div>
          )}

          <button type="submit" className={styles.submitBtn} disabled={saving}>
            {saving ? 'Saving...' : 'Create Trip'}
          </button>
        </form>
      )}

      {planned.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Upcoming Trips</h3>
          {planned.map((trip) => (
            <div key={trip.id} className={styles.tripCard}>
              <div className={styles.tripHeader}>
                <h4 className={styles.tripName}>{trip.name}</h4>
                <div className={styles.tripActions}>
                  <button className={styles.completeBtn} onClick={() => handleCompleteTrip(trip)} title="Mark complete">
                    Done
                  </button>
                  <button className={styles.tripDeleteBtn} onClick={() => deleteTrip(trip.id)} title="Delete">
                    &times;
                  </button>
                </div>
              </div>
              <div className={styles.tripMeta}>
                {trip.destination && <span>{trip.destination}</span>}
                {trip.date && <span>{new Date(trip.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>}
                {trip.targetSpecies && <span className={styles.speciesTag}>{trip.targetSpecies}</span>}
              </div>
              <button
                className={styles.toggleChecklist}
                onClick={() => setActiveTrip(activeTrip === trip.id ? null : trip.id)}
              >
                {activeTrip === trip.id ? 'Hide Checklist' : `Checklist (${(trip.checklist || []).filter(c => c.packed).length}/${(trip.checklist || []).length})`}
              </button>
              {activeTrip === trip.id && trip.checklist && (
                <div className={styles.tripChecklist}>
                  {trip.checklist.map((item, i) => (
                    <label key={i} className={styles.checkItem}>
                      <input
                        type="checkbox"
                        checked={item.packed}
                        onChange={() => handleToggleCheckItem(trip, i)}
                      />
                      <span className={item.packed ? styles.checkedText : ''}>{item.text}</span>
                      <span className={styles.checkCat}>{item.category}</span>
                    </label>
                  ))}
                </div>
              )}
              {trip.status === 'completed' && (
                <Link to="/add" className={styles.logLink}>Log catches from this trip</Link>
              )}
            </div>
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Past Trips</h3>
          {completed.map((trip) => (
            <div key={trip.id} className={`${styles.tripCard} ${styles.tripCompleted}`}>
              <div className={styles.tripHeader}>
                <h4 className={styles.tripName}>{trip.name}</h4>
                <button className={styles.tripDeleteBtn} onClick={() => deleteTrip(trip.id)} title="Delete">&times;</button>
              </div>
              <div className={styles.tripMeta}>
                {trip.destination && <span>{trip.destination}</span>}
                {trip.date && <span>{new Date(trip.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                {trip.targetSpecies && <span className={styles.speciesTag}>{trip.targetSpecies}</span>}
              </div>
              <Link to="/add" className={styles.logLink}>Log catches from this trip</Link>
            </div>
          ))}
        </div>
      )}

      {trips.length === 0 && !showForm && (
        <p className={styles.empty}>No trips planned yet. Tap above to plan one!</p>
      )}
    </div>
  );
}
