import { useState } from 'react';
import styles from './SaveSpotModal.module.css';

export default function SaveSpotModal({ lat, lng, defaultName, onSave, onClose }) {
  const [name, setName] = useState(defaultName || '');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), lat, lng, notes: notes.trim() });
      onClose();
    } catch (err) {
      console.error('Failed to save spot:', err);
      setSaving(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>Save Fishing Spot</h3>
        <p className={styles.coords}>
          {lat.toFixed(5)}, {lng.toFixed(5)}
        </p>
        <form onSubmit={handleSubmit}>
          <label className={styles.label}>
            Spot Name *
            <input
              type="text"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Big Bass Cove"
              required
              autoFocus
            />
          </label>
          <label className={styles.label}>
            Notes
            <textarea
              className={styles.textarea}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Fishing tips, conditions, etc."
              rows={3}
            />
          </label>
          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.saveBtn} disabled={saving || !name.trim()}>
              {saving ? 'Saving...' : 'Save Spot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
