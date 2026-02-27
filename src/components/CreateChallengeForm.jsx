import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFriends } from '../hooks/useFriends';
import { createChallenge } from '../utils/challenges';
import { useToast } from '../contexts/ToastContext';
import styles from './Challenges.module.css';

const TYPES = [
  { value: 'most_catches', label: 'Most Catches' },
  { value: 'biggest_catch', label: 'Biggest Catch' },
  { value: 'most_species', label: 'Most Species' },
  { value: 'total_weight', label: 'Total Weight' },
  { value: 'longest_fish', label: 'Longest Fish' },
];

export default function CreateChallengeForm({ onClose }) {
  const { user } = useAuth();
  const { friendProfiles } = useFriends();
  const toast = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('most_catches');
  const [targetSpecies, setTargetSpecies] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [saving, setSaving] = useState(false);

  function toggleFriend(friendId) {
    setSelectedFriends((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!name.trim()) return;
    if (!startDate || !endDate) return;
    if (new Date(endDate) <= new Date(startDate)) {
      toast.error('End date must be after start date');
      return;
    }
    if (visibility === 'invite_only' && selectedFriends.length === 0) {
      toast.error('Select at least one friend to invite');
      return;
    }

    setSaving(true);
    try {
      const invited = visibility === 'invite_only'
        ? selectedFriends.map((id) => {
            const f = friendProfiles.find((fp) => fp.id === id);
            return { userId: id, displayName: f?.displayName || 'Angler', photoURL: f?.photoURL || null };
          })
        : [];

      await createChallenge(user.uid, {
        name: name.trim(),
        description: description.trim(),
        type,
        targetSpecies: targetSpecies.trim() || null,
        startDate,
        endDate,
        visibility,
        invited,
        creatorDisplayName: user.displayName || 'Angler',
        creatorPhotoURL: user.photoURL || null,
      });

      toast.success('Challenge created!');
      onClose();
    } catch (err) {
      console.error('Create challenge error:', err);
      toast.error('Failed to create challenge');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Challenge Name *</label>
        <input
          className={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Weekend Bass Battle"
          required
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Description</label>
        <textarea
          className={styles.textarea}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's this challenge about?"
        />
      </div>

      <div className={styles.row}>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Challenge Type</label>
          <select className={styles.select} value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Target Species (optional)</label>
          <input
            className={styles.input}
            value={targetSpecies}
            onChange={(e) => setTargetSpecies(e.target.value)}
            placeholder="e.g. Bass"
          />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Start Date *</label>
          <input
            className={styles.input}
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>End Date *</label>
          <input
            className={styles.input}
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Visibility</label>
        <div className={styles.visibilityOptions}>
          {[
            { value: 'public', label: 'Public' },
            { value: 'friends', label: 'Friends Only' },
            { value: 'invite_only', label: 'Invite Only' },
          ].map((opt) => (
            <label key={opt.value} className={styles.radioLabel}>
              <input
                type="radio"
                name="visibility"
                value={opt.value}
                checked={visibility === opt.value}
                onChange={(e) => setVisibility(e.target.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {visibility === 'invite_only' && friendProfiles.length > 0 && (
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Invite Friends</label>
          <div className={styles.friendList}>
            {friendProfiles.map((f) => (
              <label key={f.id} className={styles.friendCheckbox}>
                <input
                  type="checkbox"
                  checked={selectedFriends.includes(f.id)}
                  onChange={() => toggleFriend(f.id)}
                />
                {f.photoURL ? (
                  <img src={f.photoURL} alt="" className={styles.friendAvatar} referrerPolicy="no-referrer" />
                ) : (
                  <span className={styles.friendAvatarInitial}>
                    {(f.displayName || '?')[0].toUpperCase()}
                  </span>
                )}
                {f.displayName || 'Angler'}
              </label>
            ))}
          </div>
        </div>
      )}

      {visibility === 'invite_only' && friendProfiles.length === 0 && (
        <p style={{ color: '#888', fontSize: '0.85rem' }}>
          Add friends first to create invite-only challenges.
        </p>
      )}

      <div className={styles.formActions}>
        <button type="button" className={styles.cancelBtn} onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className={styles.submitBtn} disabled={saving}>
          {saving ? 'Creating...' : 'Create Challenge'}
        </button>
      </div>
    </form>
  );
}
