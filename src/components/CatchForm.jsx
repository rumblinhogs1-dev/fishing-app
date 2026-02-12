import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ImageUpload from './ImageUpload';
import styles from './CatchForm.module.css';

const EMPTY = {
  species: '',
  weight: '',
  length: '',
  location: '',
  date: new Date().toISOString().slice(0, 16),
  weather: '',
  bait: '',
  notes: '',
  image: '',
};

export default function CatchForm({ existing, onSubmit }) {
  const [form, setForm] = useState(EMPTY);
  const navigate = useNavigate();

  useEffect(() => {
    if (existing) {
      setForm({
        species: existing.species || '',
        weight: existing.weight || '',
        length: existing.length || '',
        location: existing.location || '',
        date: existing.date || '',
        weather: existing.weather || '',
        bait: existing.bait || '',
        notes: existing.notes || '',
        image: existing.image || '',
      });
    }
  }, [existing]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      ...form,
      weight: form.weight ? Number(form.weight) : '',
      length: form.length ? Number(form.length) : '',
    });
    navigate('/');
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2 className={styles.heading}>{existing ? 'Edit Catch' : 'Log a Catch'}</h2>

      <div className={styles.grid}>
        <label className={styles.field}>
          <span>Species *</span>
          <input name="species" value={form.species} onChange={handleChange} required placeholder="e.g. Largemouth Bass" />
        </label>

        <label className={styles.field}>
          <span>Weight (lbs)</span>
          <input name="weight" type="number" step="0.01" min="0" value={form.weight} onChange={handleChange} placeholder="e.g. 4.5" />
        </label>

        <label className={styles.field}>
          <span>Length (in)</span>
          <input name="length" type="number" step="0.1" min="0" value={form.length} onChange={handleChange} placeholder="e.g. 18" />
        </label>

        <label className={styles.field}>
          <span>Location</span>
          <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Lake Travis" />
        </label>

        <label className={styles.field}>
          <span>Date / Time</span>
          <input name="date" type="datetime-local" value={form.date} onChange={handleChange} />
        </label>

        <label className={styles.field}>
          <span>Weather</span>
          <input name="weather" value={form.weather} onChange={handleChange} placeholder="e.g. Sunny, 75°F" />
        </label>

        <label className={styles.field}>
          <span>Bait / Lure</span>
          <input name="bait" value={form.bait} onChange={handleChange} placeholder="e.g. Plastic worm" />
        </label>

        <ImageUpload image={form.image} onChange={(img) => setForm((prev) => ({ ...prev, image: img }))} />
      </div>

      <label className={styles.field}>
        <span>Notes</span>
        <textarea name="notes" rows={3} value={form.notes} onChange={handleChange} placeholder="Any extra details..." />
      </label>

      <div className={styles.actions}>
        <button type="submit" className={styles.submitBtn}>
          {existing ? 'Save Changes' : 'Add Catch'}
        </button>
        <button type="button" className={styles.cancelBtn} onClick={() => navigate('/')}>
          Cancel
        </button>
      </div>
    </form>
  );
}
