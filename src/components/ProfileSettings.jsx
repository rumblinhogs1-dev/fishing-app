import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import styles from './ProfileSettings.module.css';

const MAX_BIO = 150;

function resizeImage(file, maxSize = 400) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function ProfileSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const fileRef = useRef(null);
  const [form, setForm] = useState({ displayName: '', bio: '', region: '', defaultVisibility: 'public' });
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({
    friend_request: true,
    friend_accepted: true,
    friend_catch: true,
    catch_liked: true,
    challenge_invite: true,
    challenge_result: true,
    trip_invite: true,
  });
  const [heatmapOptIn, setHeatmapOptIn] = useState(false);
  const [publicFields, setPublicFields] = useState({
    weight: true,
    length: true,
    location: true,
    bait: true,
    weather: true,
    waterTemp: true,
    depth: true,
    notes: true,
  });

  useEffect(() => {
    if (!user) return;
    async function load() {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setForm({
          displayName: data.displayName || user.displayName || '',
          bio: data.bio || '',
          region: data.region || '',
          defaultVisibility: data.defaultVisibility || 'public',
        });
        setPhotoPreview(data.photoURL || user.photoURL || '');
        if (data.notificationPreferences) {
          setNotifPrefs((prev) => ({ ...prev, ...data.notificationPreferences }));
        }
        if (data.publicCatchFields) {
          setPublicFields((prev) => ({ ...prev, ...data.publicCatchFields }));
        }
        if (data.heatmapOptIn != null) {
          setHeatmapOptIn(data.heatmapOptIn);
        }
      } else {
        setForm({
          displayName: user.displayName || '',
          bio: '',
          region: '',
          defaultVisibility: 'public',
        });
        setPhotoPreview(user.photoURL || '');
      }
    }
    load();
  }, [user]);

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await resizeImage(file);
    setPhotoPreview(dataUrl);
    setPhotoFile(dataUrl);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      let photoURL = photoPreview;

      // Upload new photo if changed
      if (photoFile) {
        const storageRef = ref(storage, `avatars/${user.uid}`);
        await uploadString(storageRef, photoFile, 'data_url');
        photoURL = await getDownloadURL(storageRef);
      }

      await updateProfile(auth.currentUser, {
        displayName: form.displayName,
        photoURL,
      });
      await setDoc(doc(db, 'users', user.uid), {
        displayName: form.displayName,
        displayNameLower: form.displayName.toLowerCase(),
        bio: form.bio.slice(0, MAX_BIO),
        region: form.region,
        photoURL,
        defaultVisibility: form.defaultVisibility,
        notificationPreferences: notifPrefs,
        publicCatchFields: publicFields,
        heatmapOptIn,
      }, { merge: true });
      toast.success('Settings saved!');
      navigate('/');
    } catch (err) {
      console.error('Failed to save settings:', err);
      toast.error('Failed to save. Please try again.');
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
          {photoPreview ? (
            <img src={photoPreview} alt="" className={styles.avatar} referrerPolicy="no-referrer" />
          ) : (
            <span className={styles.avatarInitial}>
              {(form.displayName || user.email || '?')[0].toUpperCase()}
            </span>
          )}
          <div className={styles.photoActions}>
            <span className={styles.email}>{user.email}</span>
            <label className={styles.photoBtn}>
              Change Photo
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                style={{ display: 'none' }}
              />
            </label>
          </div>
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
          <span>Home Fishing Region</span>
          <input
            type="text"
            value={form.region}
            onChange={(e) => setForm((prev) => ({ ...prev, region: e.target.value }))}
            placeholder="e.g. Central Arizona"
          />
        </label>

        <label className={styles.field}>
          <span>Bio ({form.bio.length}/{MAX_BIO})</span>
          <textarea
            value={form.bio}
            onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value.slice(0, MAX_BIO) }))}
            placeholder="Tell others about your fishing interests..."
            rows={3}
            maxLength={MAX_BIO}
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

        <div className={styles.notifSection}>
          <h3 className={styles.sectionTitle}>Notification Preferences</h3>
          {[
            { key: 'friend_request', label: 'Friend Requests' },
            { key: 'friend_accepted', label: 'Friend Accepted' },
            { key: 'friend_catch', label: "Friends' Catches" },
            { key: 'catch_liked', label: 'Catch Reactions' },
            { key: 'challenge_invite', label: 'Challenge Invites' },
            { key: 'challenge_result', label: 'Challenge Results' },
            { key: 'trip_invite', label: 'Trip Invites' },
          ].map(({ key, label }) => (
            <div key={key} className={styles.toggleRow}>
              <span className={styles.toggleLabel}>{label}</span>
              <button
                type="button"
                className={`${styles.toggleSwitch} ${notifPrefs[key] ? styles.toggleOn : ''}`}
                onClick={() => setNotifPrefs((prev) => ({ ...prev, [key]: !prev[key] }))}
                aria-label={`Toggle ${label}`}
              >
                <span className={styles.toggleKnob} />
              </button>
            </div>
          ))}
        </div>

        <div className={styles.notifSection}>
          <h3 className={styles.sectionTitle}>Public Catch Display</h3>
          <p className={styles.sectionHint}>Choose which fields others can see on your public catches.</p>
          {[
            { key: 'weight', label: 'Weight' },
            { key: 'length', label: 'Length' },
            { key: 'location', label: 'Location' },
            { key: 'bait', label: 'Bait / Lure' },
            { key: 'weather', label: 'Weather' },
            { key: 'waterTemp', label: 'Water Temp' },
            { key: 'depth', label: 'Depth' },
            { key: 'notes', label: 'Notes' },
          ].map(({ key, label }) => (
            <div key={key} className={styles.toggleRow}>
              <span className={styles.toggleLabel}>{label}</span>
              <button
                type="button"
                className={`${styles.toggleSwitch} ${publicFields[key] ? styles.toggleOn : ''}`}
                onClick={() => setPublicFields((prev) => ({ ...prev, [key]: !prev[key] }))}
                aria-label={`Toggle ${label}`}
              >
                <span className={styles.toggleKnob} />
              </button>
            </div>
          ))}
        </div>

        <div className={styles.notifSection}>
          <h3 className={styles.sectionTitle}>Community Heatmap</h3>
          <p className={styles.sectionHint}>Share your catch locations anonymously to help build a community fishing heatmap.</p>
          <div className={styles.toggleRow}>
            <span className={styles.toggleLabel}>Contribute to heatmap</span>
            <button
              type="button"
              className={`${styles.toggleSwitch} ${heatmapOptIn ? styles.toggleOn : ''}`}
              onClick={() => setHeatmapOptIn((prev) => !prev)}
              aria-label="Toggle community heatmap sharing"
            >
              <span className={styles.toggleKnob} />
            </button>
          </div>
        </div>

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
