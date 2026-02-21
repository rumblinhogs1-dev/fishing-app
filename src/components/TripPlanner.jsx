import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFriends } from '../hooks/useFriends';
import { useSpots } from '../hooks/useSpots';
import { addTrip, updateTrip, deleteTrip, subscribeToTrips, backfillMemberIds, addMemberToTrip, removeMemberFromTrip, getTripCatches } from '../utils/trips';
import { notifyTripInvite } from '../utils/notifications';
import { useNavigate } from 'react-router-dom';
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
  endDate: '',
  targetSpecies: '',
};

export default function TripPlanner({ catches = [] }) {
  const { user } = useAuth();
  const { friendProfiles } = useFriends();
  const { spots } = useSpots();
  const toast = useToast();
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_TRIP);
  const [activeTrip, setActiveTrip] = useState(null);
  const [saving, setSaving] = useState(false);
  const [invitedIds, setInvitedIds] = useState([]);
  const [editingTrip, setEditingTrip] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_TRIP);
  const [managingMembers, setManagingMembers] = useState(null);
  const [tripCatches, setTripCatches] = useState({});
  const [loadingCatches, setLoadingCatches] = useState({});
  const backfilled = useRef(false);

  // Backfill existing trips that lack memberIds
  useEffect(() => {
    if (!user || backfilled.current) return;
    backfilled.current = true;
    backfillMemberIds(user.uid).catch(() => {});
  }, [user]);

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

  function toggleInvite(id) {
    setInvitedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleCreateTrip(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.destination.trim()) return;
    setSaving(true);
    try {
      const members = [
        { userId: user.uid, displayName: user.displayName || 'You', photoURL: user.photoURL || null },
        ...invitedIds.map((id) => {
          const f = friendProfiles.find((fp) => fp.id === id);
          return { userId: id, displayName: f?.displayName || 'Angler', photoURL: f?.photoURL || null };
        }),
      ];
      const newId = await addTrip(user.uid, {
        name: form.name.trim(),
        destination: form.destination.trim(),
        lat: form.lat || null,
        lng: form.lng || null,
        date: form.date || null,
        endDate: form.endDate || null,
        targetSpecies: form.targetSpecies.trim(),
        catches: [],
        invitedIds,
        members,
      });
      // Notify invited friends
      const tripName = form.name.trim();
      invitedIds.forEach((id) => {
        notifyTripInvite(user.uid, user.displayName, id, tripName).catch(() => {});
      });
      toast.success('Trip saved!');
      setForm(EMPTY_TRIP);
      setInvitedIds([]);
      setShowForm(false);
      setActiveTrip(newId);
    } catch (err) {
      console.error('Failed to create trip:', err);
      toast.error('Failed to create trip');
    } finally {
      setSaving(false);
    }
  }

  async function handleCompleteTrip(trip) {
    await updateTrip(trip.id, { status: 'completed' });
  }

  function startEditing(trip) {
    setEditingTrip(trip.id);
    setEditForm({
      name: trip.name || '',
      destination: trip.destination || '',
      lat: trip.lat || '',
      lng: trip.lng || '',
      date: trip.date || '',
      endDate: trip.endDate || '',
      targetSpecies: trip.targetSpecies || '',
    });
  }

  function cancelEditing() {
    setEditingTrip(null);
    setEditForm(EMPTY_TRIP);
  }

  async function handleAddMember(trip, friendProfile) {
    try {
      const memberObj = {
        userId: friendProfile.id,
        displayName: friendProfile.displayName || 'Angler',
        photoURL: friendProfile.photoURL || null,
      };
      await addMemberToTrip(trip.id, memberObj);
      notifyTripInvite(user.uid, user.displayName, friendProfile.id, trip.name).catch(() => {});
      toast.success(`${friendProfile.displayName || 'Friend'} added!`);
    } catch (err) {
      console.error('Failed to add member:', err);
      toast.error('Failed to add member');
    }
  }

  async function handleRemoveMember(trip, memberId) {
    try {
      await removeMemberFromTrip(trip.id, memberId);
      toast.success('Member removed');
    } catch (err) {
      console.error('Failed to remove member:', err);
      toast.error('Failed to remove member');
    }
  }

  async function loadTripCatches(trip) {
    if (tripCatches[trip.id] || loadingCatches[trip.id]) return;
    if (!trip.date || !trip.endDate) return;
    setLoadingCatches((prev) => ({ ...prev, [trip.id]: true }));
    try {
      // Own catches from prop (filter by date range)
      const start = new Date(trip.date);
      const end = new Date(trip.endDate);
      const ownMatches = catches.filter((c) => {
        if (!c.createdAt) return false;
        const d = new Date(c.createdAt);
        return d >= start && d <= end;
      });
      // Friend catches from Firestore
      const friendMemberIds = (trip.memberIds || []).filter((id) => id !== user.uid);
      let friendCatches = [];
      if (friendMemberIds.length > 0) {
        friendCatches = await getTripCatches(friendMemberIds, trip.date, trip.endDate);
      }
      const all = [...ownMatches, ...friendCatches];
      all.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setTripCatches((prev) => ({ ...prev, [trip.id]: all }));
    } catch (err) {
      console.error('Failed to load trip catches:', err);
      setTripCatches((prev) => ({ ...prev, [trip.id]: [] }));
    } finally {
      setLoadingCatches((prev) => ({ ...prev, [trip.id]: false }));
    }
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    if (!editForm.name.trim() || !editForm.destination.trim()) return;
    setSaving(true);
    try {
      await updateTrip(editingTrip, {
        name: editForm.name.trim(),
        destination: editForm.destination.trim(),
        lat: editForm.lat || null,
        lng: editForm.lng || null,
        date: editForm.date || null,
        endDate: editForm.endDate || null,
        targetSpecies: editForm.targetSpecies.trim(),
      });
      toast.success('Trip updated!');
      setEditingTrip(null);
      setEditForm(EMPTY_TRIP);
    } catch (err) {
      console.error('Failed to update trip:', err);
      toast.error('Failed to update trip');
    } finally {
      setSaving(false);
    }
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
              <label className={styles.label}>Arrival</label>
              <input
                type="datetime-local"
                className={styles.input}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Departure</label>
              <input
                type="datetime-local"
                className={styles.input}
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
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

          <div className={styles.inviteSection}>
            <span className={styles.inviteLabel}>
              Invite Friends {friendProfiles.length > 0 && `(${invitedIds.length} selected)`}
            </span>
            {friendProfiles.length > 0 ? (
              <div className={styles.inviteList}>
                {friendProfiles.map((f) => (
                  <label key={f.id} className={`${styles.inviteItem} ${invitedIds.includes(f.id) ? styles.inviteSelected : ''}`}>
                    <input
                      type="checkbox"
                      checked={invitedIds.includes(f.id)}
                      onChange={() => toggleInvite(f.id)}
                      className={styles.inviteCheckbox}
                    />
                    {f.photoURL ? (
                      <img src={f.photoURL} alt="" className={styles.inviteAvatar} referrerPolicy="no-referrer" />
                    ) : (
                      <span className={styles.inviteInitial}>{(f.displayName || '?')[0].toUpperCase()}</span>
                    )}
                    <span className={styles.inviteName}>{f.displayName || 'Angler'}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className={styles.noFriends}>
                <Link to="/friends" className={styles.noFriendsLink}>Add friends</Link> to invite them on trips
              </p>
            )}
          </div>

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
              {editingTrip === trip.id ? (
                <form className={styles.editForm} onSubmit={handleSaveEdit}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Trip Name</label>
                    <input
                      className={styles.input}
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      required
                      autoFocus
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Destination</label>
                    <input
                      className={styles.input}
                      value={editForm.destination}
                      onChange={(e) => setEditForm({ ...editForm, destination: e.target.value })}
                    />
                  </div>
                  <div className={styles.row}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Arrival</label>
                      <input
                        type="datetime-local"
                        className={styles.input}
                        value={editForm.date}
                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Departure</label>
                      <input
                        type="datetime-local"
                        className={styles.input}
                        value={editForm.endDate}
                        onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Target Species</label>
                    <input
                      className={styles.input}
                      value={editForm.targetSpecies}
                      onChange={(e) => setEditForm({ ...editForm, targetSpecies: e.target.value })}
                    />
                  </div>
                  <div className={styles.editActions}>
                    <button type="submit" className={styles.saveBtn} disabled={saving}>
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button type="button" className={styles.cancelBtn} onClick={cancelEditing}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div
                    className={styles.tripClickable}
                    onClick={() => setActiveTrip(activeTrip === trip.id ? null : trip.id)}
                  >
                    <div className={styles.tripHeader}>
                      <h4 className={styles.tripName}>{trip.name}</h4>
                      <span className={styles.expandIcon}>{activeTrip === trip.id ? '\u25B2' : '\u25BC'}</span>
                    </div>
                    <div className={styles.tripMeta}>
                      {trip.destination && <span>{trip.destination}</span>}
                      {trip.date && (
                        <span>
                          {new Date(trip.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          {trip.endDate && ` \u2192 ${new Date(trip.endDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`}
                        </span>
                      )}
                      {trip.targetSpecies && <span className={styles.speciesTag}>{trip.targetSpecies}</span>}
                    </div>
                  </div>
                  {activeTrip === trip.id && (
                    <div className={styles.tripDetails}>
                      <div className={styles.tripActions}>
                        <button className={styles.editBtn} onClick={() => startEditing(trip)} title="Edit trip">
                          Edit
                        </button>
                        {trip.userId === user.uid && (
                          <button
                            className={styles.manageMembersBtn}
                            onClick={() => setManagingMembers(managingMembers === trip.id ? null : trip.id)}
                          >
                            {managingMembers === trip.id ? 'Close' : 'Manage Members'}
                          </button>
                        )}
                        <button className={styles.completeBtn} onClick={() => handleCompleteTrip(trip)} title="Mark complete">
                          Done
                        </button>
                        <button className={styles.tripDeleteBtn} onClick={() => deleteTrip(trip.id)} title="Delete">
                          &times;
                        </button>
                      </div>
                      {trip.destination && (
                        <Link to={`/local-guide?location=${encodeURIComponent(trip.destination)}`} className={styles.guideLink}>
                          Find Guides & Lodging
                        </Link>
                      )}
                      {trip.members && trip.members.length > 1 && (
                        <div className={styles.memberAvatars}>
                          {trip.members.map((m) => (
                            m.photoURL ? (
                              <img key={m.userId} src={m.photoURL} alt={m.displayName} className={styles.memberAvatar} referrerPolicy="no-referrer" title={m.displayName} />
                            ) : (
                              <span key={m.userId} className={styles.memberInitial} title={m.displayName}>
                                {(m.displayName || '?')[0].toUpperCase()}
                              </span>
                            )
                          ))}
                        </div>
                      )}
                      {managingMembers === trip.id && (
                        <div className={styles.manageMembersPanel}>
                          <h5 className={styles.panelTitle}>Current Members</h5>
                          {(trip.members || []).map((m) => (
                            <div key={m.userId} className={styles.memberRow}>
                              {m.photoURL ? (
                                <img src={m.photoURL} alt="" className={styles.memberAvatar} referrerPolicy="no-referrer" />
                              ) : (
                                <span className={styles.memberInitial}>{(m.displayName || '?')[0].toUpperCase()}</span>
                              )}
                              <span className={styles.memberName}>{m.displayName || 'Angler'}</span>
                              {m.userId !== user.uid && (
                                <button className={styles.removeBtn} onClick={() => handleRemoveMember(trip, m.userId)}>
                                  Remove
                                </button>
                              )}
                            </div>
                          ))}
                          {friendProfiles.filter((f) => !(trip.memberIds || []).includes(f.id)).length > 0 && (
                            <>
                              <h5 className={styles.panelTitle}>Invite Friends</h5>
                              {friendProfiles
                                .filter((f) => !(trip.memberIds || []).includes(f.id))
                                .map((f) => (
                                  <div key={f.id} className={styles.memberRow}>
                                    {f.photoURL ? (
                                      <img src={f.photoURL} alt="" className={styles.memberAvatar} referrerPolicy="no-referrer" />
                                    ) : (
                                      <span className={styles.memberInitial}>{(f.displayName || '?')[0].toUpperCase()}</span>
                                    )}
                                    <span className={styles.memberName}>{f.displayName || 'Angler'}</span>
                                    <button className={styles.inviteBtn} onClick={() => handleAddMember(trip, f)}>
                                      Invite
                                    </button>
                                  </div>
                                ))}
                            </>
                          )}
                        </div>
                      )}
                      {trip.status === 'completed' && (
                        <Link to="/add" className={styles.logLink}>Log catches from this trip</Link>
                      )}
                    </div>
                  )}
                </>
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
              <div
                className={styles.tripClickable}
                onClick={() => {
                  const expanding = activeTrip !== trip.id;
                  setActiveTrip(expanding ? trip.id : null);
                  if (expanding) loadTripCatches(trip);
                }}
              >
                <div className={styles.tripHeader}>
                  <h4 className={styles.tripName}>{trip.name}</h4>
                  <span className={styles.expandIcon}>{activeTrip === trip.id ? '\u25B2' : '\u25BC'}</span>
                </div>
                <div className={styles.tripMeta}>
                  {trip.destination && <span>{trip.destination}</span>}
                  {trip.date && (
                    <span>
                      {new Date(trip.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {trip.endDate && ` \u2192 ${new Date(trip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                    </span>
                  )}
                  {trip.targetSpecies && <span className={styles.speciesTag}>{trip.targetSpecies}</span>}
                </div>
              </div>
              {activeTrip === trip.id && (
                <div className={styles.tripDetails}>
                  <div className={styles.tripActions}>
                    <button className={styles.tripDeleteBtn} onClick={() => deleteTrip(trip.id)} title="Delete">&times;</button>
                  </div>
                  {trip.members && trip.members.length > 1 && (
                    <div className={styles.memberAvatars}>
                      {trip.members.map((m) => (
                        m.photoURL ? (
                          <img key={m.userId} src={m.photoURL} alt={m.displayName} className={styles.memberAvatar} referrerPolicy="no-referrer" title={m.displayName} />
                        ) : (
                          <span key={m.userId} className={styles.memberInitial} title={m.displayName}>
                            {(m.displayName || '?')[0].toUpperCase()}
                          </span>
                        )
                      ))}
                    </div>
                  )}
                  <div className={styles.tripCatchesSection}>
                    <h5 className={styles.panelTitle}>Catches</h5>
                    {!trip.date || !trip.endDate ? (
                      <p className={styles.noCatches}>Add trip dates to see catches from this trip.</p>
                    ) : loadingCatches[trip.id] ? (
                      <p className={styles.noCatches}>Loading catches...</p>
                    ) : tripCatches[trip.id] ? (
                      tripCatches[trip.id].length > 0 ? (
                        <div className={styles.tripCatchesList}>
                          {tripCatches[trip.id].map((c) => (
                            <div
                              key={c.id}
                              className={styles.tripCatchItem}
                              onClick={() => navigate(`/catch/${c.id}`)}
                            >
                              {c.imageUrl ? (
                                <img src={c.imageUrl} alt="" className={styles.tripCatchThumb} />
                              ) : (
                                <span className={styles.tripCatchThumbPlaceholder}>🐟</span>
                              )}
                              <div className={styles.tripCatchInfo}>
                                <span className={styles.tripCatchSpecies}>{c.species || 'Unknown species'}</span>
                                <span className={styles.tripCatchMeta}>
                                  {c.weight ? `${c.weight} lbs` : ''}
                                  {c.weight && c.authorDisplayName ? ' · ' : ''}
                                  {c.authorDisplayName || ''}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className={styles.noCatches}>No catches logged during this trip.</p>
                      )
                    ) : null}
                  </div>
                  <Link to="/add" className={styles.logLink}>Log catches from this trip</Link>
                </div>
              )}
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
