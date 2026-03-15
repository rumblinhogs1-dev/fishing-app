import { useState } from 'react';
import styles from './TripTabs.module.css';

export default function TripItinerary({ trip, user, onAddItem, onRemoveItem }) {
  const [form, setForm] = useState({ time: '', description: '' });
  const isCreator = trip.userId === user.uid;
  const items = (trip.itinerary || []).sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  // Group items by day
  const grouped = {};
  items.forEach((item) => {
    const day = item.time ? new Date(item.time).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : 'Unscheduled';
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(item);
  });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.description.trim()) return;
    await onAddItem({ time: form.time || null, description: form.description.trim() });
    setForm({ time: '', description: '' });
  }

  return (
    <div className={styles.tabContent}>
      {Object.keys(grouped).length > 0 ? (
        Object.entries(grouped).map(([day, dayItems]) => (
          <div key={day} className={styles.itinDayGroup}>
            <h4 className={styles.itinDayLabel}>{day}</h4>
            {dayItems.map((item) => (
              <div key={item.id} className={styles.itinItem}>
                <div className={styles.itinTimeline}>
                  <div className={styles.itinDot} />
                  <div className={styles.itinLine} />
                </div>
                <div className={styles.itinContent}>
                  {item.time && (
                    <span className={styles.itinTime}>
                      {new Date(item.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  )}
                  <span className={styles.itinDesc}>{item.description}</span>
                </div>
                {isCreator && (
                  <button className={styles.itinRemoveBtn} onClick={() => onRemoveItem(item.id)}>&times;</button>
                )}
              </div>
            ))}
          </div>
        ))
      ) : (
        <p className={styles.emptyText}>No activities planned yet. Add your first one below.</p>
      )}

      {isCreator && (
        <form className={styles.itinForm} onSubmit={handleSubmit}>
          <input
            type="datetime-local"
            className={styles.itinTimeInput}
            value={form.time}
            onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
          />
          <input
            className={styles.itinDescInput}
            placeholder="Activity (e.g. Launch boat, Fish the cove)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <button type="submit" className={styles.itinAddBtn} disabled={!form.description.trim()}>Add</button>
        </form>
      )}
    </div>
  );
}
