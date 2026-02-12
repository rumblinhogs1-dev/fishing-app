import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db, auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import styles from './ProfileSettings.module.css';

export default function ProfileSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ displayName: '', bio: '', defaultVisibility: 'public' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setForm({
          displayName: data.displayName || user.displayName || '',
          bio: data.bio || '',
          defaultVisibility: data.defaultVisibility || 'public',
        });
      } else {
        setForm({
          displayName: user.displayName || '',
          bio: '',
          defaultVisibility: 'public',
        });
      }
    }
    load();
  }, [user]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaved(false);
    try {
      await updateProfile(auth.currentUser, { displayName: form.displayName });
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: form.displayName,
        bio: form.bio,
        defaultVisibility: form.defaultVisibility,
      });
      setSaved(true);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <div className={styles.container}>
        <p className={styles.empty}>Please sign in to access settings.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Profile Settings</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.profilePreview}>
          {user.photoURL ? (
            <img src={user.photoURL} alt="" className={styles.avatar} referrerPolicy="no-referrer" />
          ) : (
            <span className={styles.avatarInitial}>
              {(form.displayName || user.email || '?')[0].toUpperCase()}
            </span>
          )}
          <span className={styles.email}>{user.email}</span>
        </div>

        <label className={styles.field}>
          <span>Display Name</span>
          <input
            type="text"
            value={form.displayName}
            onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
            placeholder="Your name"
          />
        </label>

        <label className={styles.field}>
          <span>Bio</span>
          <textarea
            value={form.bio}
            onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
            placeholder="Tell others about your fishing interests..."
            rows={3}
          />
        </label>

        <label className={styles.field}>
          <span>Default Catch Visibility</span>
          <select
            value={form.defaultVisibility}
            onChange={(e) => setForm((prev) => ({ ...prev, defaultVisibility: e.target.value }))}
          >
            <option value="public">Public</option>
            <option value="friends">Friends Only</option>
            <option value="private">Private</option>
          </select>
        </label>

        {saved && <div className={styles.success}>Settings saved!</div>}

        <div className={styles.actions}>
          <button type="submit" className={styles.saveBtn} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          <button type="button" className={styles.cancelBtn} onClick={() => navigate('/')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
