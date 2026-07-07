import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFriends } from '../hooks/useFriends';
import { useSpots } from '../hooks/useSpots';
import { addTrip, updateTrip, deleteTrip, subscribeToTrips, backfillMemberIds, addMemberToTrip, removeMemberFromTrip, getTripCatches, addItineraryItem, removeItineraryItem, addExpense, removeExpense, subscribeToTripPhotos, addTripPhoto, deleteTripPhoto } from '../utils/trips';
import { uploadTripPhoto, deleteTripPhotoFile } from '../utils/firebaseStorage';
import { notifyTripInvite } from '../utils/notifications';
import { createTripChat, addMemberToGroup, removeMemberFromGroup } from '../utils/chat';
import { fetchForecastData } from '../utils/forecast';
import { getGPSLocation, reverseGeocode } from '../utils/weather';
import { SkeletonCard } from './Skeleton';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import UpgradePrompt from './UpgradePrompt';
import TripOverview from './trips/TripOverview';
import TripItinerary from './trips/TripItinerary';
import TripExpenses from './trips/TripExpenses';
import TripPhotos from './trips/TripPhotos';
import TripCatches from './trips/TripCatches';
import tabStyles from './trips/TripTabs.module.css';
import styles from './TripPlanner.module.css';

const TRIPS_COMING_SOON = true;

const EMPTY_TRIP = { name: '', destination: '', lat: '', lng: '', date: '', endDate: '', targetSpecies: '' };
const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'itinerary', label: 'Plan' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'photos', label: 'Photos' },
  { key: 'catches', label: 'Catches' },
];

export default function TripPlanner({ catches = [] }) {
  if (TRIPS_COMING_SOON) return <TripComingSoon />;
  return <TripPlannerInner catches={catches} />;
}

function TripComingSoon() {
  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Trip Planner</h2>
      <div className={styles.comingSoon}>
        <div className={styles.comingSoonIcon}>🗺️</div>
        <h3 className={styles.comingSoonTitle}>Coming Soon</h3>
        <p className={styles.comingSoonDesc}>
          Trip Planner is on its way — plan your next fishing adventure, coordinate with your crew, and track every detail in one place.
        </p>
        <ul className={styles.featureList}>
          <li className={styles.featureItem}>📅 Plan trips with dates, destinations &amp; target species</li>
          <li className={styles.featureItem}>👥 Invite fishing buddies and manage your crew</li>
          <li className={styles.featureItem}>💰 Split expenses and settle up after the trip</li>
          <li className={styles.featureItem}>📸 Share photos and log catches from the water</li>
          <li className={styles.featureItem}>⛅ Get weather forecasts for your trip window</li>
        </ul>
        <p className={styles.comingSoonFooter}>Stay tuned — big update incoming.</p>
      </div>
    </div>
  );
}

function TripPlannerInner({ catches = [] }) {
  const { user } = useAuth();
  const { friendProfiles } = useFriends();
  const { spots } = useSpots();
  const toast = useToast();
  const confirm = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_TRIP);
  const [activeTrip, setActiveTrip] = useState(searchParams.get('trip') || null);
  const [activeTab, setActiveTab] = useState('overview');
  const [saving, setSaving] = useState(false);
  const [invitedIds, setInvitedIds] = useState([]);
  const [editingTrip, setEditingTrip] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_TRIP);
  const [managingMembers, setManagingMembers] = useState(null);
  const [tripCatches, setTripCatches] = useState({});
  const [loadingCatches, setLoadingCatches] = useState({});
  const [tripWeather, setTripWeather] = useState({});
  const [loadingWeather, setLoadingWeather] = useState({});
  const [tripPhotos, setTripPhotos] = useState({});
  const [photoUnsubs, setPhotoUnsubs] = useState({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const backfilled = useRef(false);

  useEffect(() => {
    if (!user || backfilled.current) return;
    backfilled.current = true;
    backfillMemberIds(user.uid).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) { setTrips([]); setLoading(false); return; }
    setLoading(true);
    const unsub = subscribeToTrips(user.uid, (data) => { setTrips(data); setLoading(false); });
    return unsub;
  }, [user]);

  // Sync activeTrip → URL
  useEffect(() => {
    const current = searchParams.get('trip');
    if (activeTrip && activeTrip !== current) {
      setSearchParams({ trip: activeTrip }, { replace: false });
    } else if (!activeTrip && current) {
      setSearchParams({}, { replace: false });
    }
  }, [activeTrip]);

  // Sync URL → activeTrip (browser back/forward)
  useEffect(() => {
    const tripParam = searchParams.get('trip');
    if (tripParam !== activeTrip) {
      setActiveTrip(tripParam || null);
      if (tripParam) setActiveTab('overview');
    }
  }, [searchParams]);

  useEffect(() => {
    return () => { Object.values(photoUnsubs).forEach((unsub) => { if (unsub) unsub(); }); };
  }, []);

  // ── Trip CRUD ──

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
    if (spot) setForm((f) => ({ ...f, destination: spot.name, lat: spot.lat, lng: spot.lng }));
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
        name: form.name.trim(), destination: form.destination.trim(),
        lat: form.lat || null, lng: form.lng || null,
        date: form.date || null, endDate: form.endDate || null,
        targetSpecies: form.targetSpecies.trim(), catches: [], invitedIds, members,
      });
      try {
        const chatGroupId = await createTripChat(newId, form.name.trim(), invitedIds, user.uid);
        await updateTrip(newId, { chatGroupId });
      } catch {}
      invitedIds.forEach((id) => { notifyTripInvite(user.uid, user.displayName, id, form.name.trim()).catch(() => {}); });
      toast.success('Trip saved!');
      setForm(EMPTY_TRIP); setInvitedIds([]); setShowForm(false);
      setActiveTrip(newId); setActiveTab('overview');
    } catch { toast.error('Failed to create trip'); }
    finally { setSaving(false); }
  }

  async function handleCompleteTrip(trip) {
    const ok = await confirm(`Move "${trip.name}" to Past Trips?`);
    if (!ok) return;
    await updateTrip(trip.id, { status: 'completed' });
  }

  async function handleDeleteTrip(trip) {
    const ok = await confirm(`Delete "${trip.name}"? This can't be undone.`, { destructive: true });
    if (!ok) return;
    await deleteTrip(trip.id);
    if (activeTrip === trip.id) setActiveTrip(null);
  }

  // ── Edit ──

  function startEditing(trip) {
    setEditingTrip(trip.id);
    setEditForm({ name: trip.name || '', destination: trip.destination || '', lat: trip.lat || '', lng: trip.lng || '', date: trip.date || '', endDate: trip.endDate || '', targetSpecies: trip.targetSpecies || '' });
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    if (!editForm.name.trim() || !editForm.destination.trim()) return;
    setSaving(true);
    try {
      await updateTrip(editingTrip, { name: editForm.name.trim(), destination: editForm.destination.trim(), lat: editForm.lat || null, lng: editForm.lng || null, date: editForm.date || null, endDate: editForm.endDate || null, targetSpecies: editForm.targetSpecies.trim() });
      toast.success('Trip updated!');
      setEditingTrip(null); setEditForm(EMPTY_TRIP);
    } catch { toast.error('Failed to update trip'); }
    finally { setSaving(false); }
  }

  // ── Members ──

  async function handleAddMember(trip, friendProfile) {
    try {
      const memberObj = { userId: friendProfile.id, displayName: friendProfile.displayName || 'Angler', photoURL: friendProfile.photoURL || null };
      await addMemberToTrip(trip.id, memberObj);
      if (trip.chatGroupId) addMemberToGroup(trip.chatGroupId, friendProfile.id).catch(() => {});
      notifyTripInvite(user.uid, user.displayName, friendProfile.id, trip.name).catch(() => {});
      toast.success(`${friendProfile.displayName || 'Friend'} added!`);
    } catch { toast.error('Failed to add member'); }
  }

  async function handleRemoveMember(trip, memberId) {
    try {
      await removeMemberFromTrip(trip.id, memberId);
      if (trip.chatGroupId) removeMemberFromGroup(trip.chatGroupId, memberId).catch(() => {});
      toast.success('Member removed');
    } catch { toast.error('Failed to remove member'); }
  }

  // ── Catches ──

  async function loadTripCatches(trip) {
    if (tripCatches[trip.id] || loadingCatches[trip.id]) return;
    if (!trip.date || !trip.endDate) return;
    setLoadingCatches((prev) => ({ ...prev, [trip.id]: true }));
    try {
      const start = new Date(trip.date), end = new Date(trip.endDate);
      const ownMatches = catches.filter((c) => { if (!c.createdAt) return false; const d = new Date(c.createdAt); return d >= start && d <= end; });
      const friendMemberIds = (trip.memberIds || []).filter((id) => id !== user.uid);
      let friendCatches = [];
      if (friendMemberIds.length > 0) friendCatches = await getTripCatches(friendMemberIds, trip.date, trip.endDate);
      const all = [...ownMatches, ...friendCatches].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setTripCatches((prev) => ({ ...prev, [trip.id]: all }));
    } catch { setTripCatches((prev) => ({ ...prev, [trip.id]: [] })); }
    finally { setLoadingCatches((prev) => ({ ...prev, [trip.id]: false })); }
  }

  function computeTripStats(tripCatchList) {
    if (!tripCatchList?.length) return null;
    const speciesMap = {}; let totalWeight = 0; let biggest = null;
    tripCatchList.forEach((c) => {
      if (c.species) speciesMap[c.species] = (speciesMap[c.species] || 0) + 1;
      if (c.weight) { totalWeight += Number(c.weight) || 0; if (!biggest || Number(c.weight) > Number(biggest.weight)) biggest = c; }
    });
    return { totalCatches: tripCatchList.length, speciesCount: Object.keys(speciesMap).length, biggest, totalWeight: Math.round(totalWeight * 100) / 100 };
  }

  // ── Weather ──

  async function loadTripWeather(trip) {
    if (!trip.lat || !trip.lng || loadingWeather[trip.id]) return;
    setLoadingWeather((prev) => ({ ...prev, [trip.id]: true }));
    try {
      const data = await fetchForecastData(trip.lat, trip.lng);
      let days = data.days || [];
      if (trip.date) {
        const start = trip.date.slice(0, 10), end = trip.endDate ? trip.endDate.slice(0, 10) : start;
        days = days.filter((d) => d.date >= start && d.date <= end);
      }
      setTripWeather((prev) => ({ ...prev, [trip.id]: days }));
    } catch { setTripWeather((prev) => ({ ...prev, [trip.id]: [] })); }
    finally { setLoadingWeather((prev) => ({ ...prev, [trip.id]: false })); }
  }

  // ── Itinerary ──

  async function handleAddItineraryItem(tripId, item) {
    try { await addItineraryItem(tripId, item); toast.success('Added'); }
    catch { toast.error('Failed to add item'); }
  }

  async function handleRemoveItineraryItem(tripId, itemId) {
    try { await removeItineraryItem(tripId, itemId); } catch {}
  }

  // ── Expenses ──

  async function handleAddExpense(tripId, expense) {
    try { await addExpense(tripId, expense); toast.success('Expense added'); }
    catch { toast.error('Failed to add expense'); }
  }

  async function handleRemoveExpense(tripId, expenseId) {
    const ok = await confirm('Remove this expense?', { destructive: true });
    if (!ok) return;
    try { await removeExpense(tripId, expenseId); } catch { toast.error('Failed to remove expense'); }
  }

  // ── Photos ──

  function loadTripPhotos(tripId) {
    if (tripPhotos[tripId] !== undefined) return;
    setTripPhotos((prev) => ({ ...prev, [tripId]: [] }));
    const unsub = subscribeToTripPhotos(tripId, (photos) => { setTripPhotos((prev) => ({ ...prev, [tripId]: photos })); });
    setPhotoUnsubs((prev) => ({ ...prev, [tripId]: unsub }));
  }

  async function handleUploadPhoto(tripId, imageData, caption) {
    setUploadingPhoto(true);
    try {
      const tempId = `photo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const imageUrl = await uploadTripPhoto(tripId, tempId, imageData);
      await addTripPhoto(tripId, { imageUrl, caption, uploadedByUserId: user.uid, uploadedByName: user.displayName || 'Anonymous', uploadedByPhotoURL: user.photoURL || null, storageId: tempId });
      toast.success('Photo uploaded!');
    } catch { toast.error('Failed to upload photo'); }
    finally { setUploadingPhoto(false); }
  }

  async function handleDeletePhoto(tripId, photo) {
    const ok = await confirm('Delete this photo?', { destructive: true });
    if (!ok) return;
    try { await deleteTripPhoto(tripId, photo.id); if (photo.storageId) deleteTripPhotoFile(tripId, photo.storageId).catch(() => {}); toast.success('Photo deleted'); }
    catch { toast.error('Failed to delete photo'); }
  }

  // ── Rendering ──

  if (!user) return <div className={styles.container}><h2 className={styles.heading}>Trip Planner</h2><p className={styles.empty}>Sign in to plan your fishing trips.</p></div>;
  if (loading) return <div className={styles.container}><h2 className={styles.heading}>Trip Planner</h2><SkeletonCard /><SkeletonCard /></div>;

  const planned = trips.filter((t) => t.status === 'planned');
  const completed = trips.filter((t) => t.status === 'completed');

  function renderTripCard(trip) {
    const isActive = activeTrip === trip.id;

    if (editingTrip === trip.id) {
      return (
        <div key={trip.id} className={styles.tripCard}>
          <form className={styles.editForm} onSubmit={handleSaveEdit}>
            <div className={styles.fieldGroup}><label className={styles.label}>Trip Name</label><input className={styles.input} value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required autoFocus /></div>
            <div className={styles.fieldGroup}><label className={styles.label}>Destination</label><input className={styles.input} value={editForm.destination} onChange={(e) => setEditForm({ ...editForm, destination: e.target.value })} /></div>
            <div className={styles.row}>
              <div className={styles.fieldGroup}><label className={styles.label}>Arrival</label><input type="datetime-local" className={styles.input} value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} /></div>
              <div className={styles.fieldGroup}><label className={styles.label}>Departure</label><input type="datetime-local" className={styles.input} value={editForm.endDate} onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })} /></div>
            </div>
            <div className={styles.fieldGroup}><label className={styles.label}>Target Species</label><input className={styles.input} value={editForm.targetSpecies} onChange={(e) => setEditForm({ ...editForm, targetSpecies: e.target.value })} /></div>
            <div className={styles.editActions}>
              <button type="submit" className={styles.saveBtn} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              <button type="button" className={styles.cancelBtn} onClick={() => { setEditingTrip(null); setEditForm(EMPTY_TRIP); }}>Cancel</button>
            </div>
          </form>
        </div>
      );
    }

    return (
      <div key={trip.id} className={`${styles.tripCard} ${trip.status === 'completed' ? styles.tripCompleted : ''}`}>
        <div className={styles.tripClickable} onClick={() => {
          const expanding = !isActive;
          setActiveTrip(expanding ? trip.id : null);
          setActiveTab('overview');
          if (expanding) loadTripCatches(trip);
        }}>
          <div className={styles.tripHeader}>
            <h4 className={styles.tripName}>{trip.name}</h4>
            <span className={styles.expandIcon}>{isActive ? '\u25B2' : '\u25BC'}</span>
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
          {trip.members && trip.members.length > 1 && (
            <div className={styles.memberAvatars}>
              {trip.members.map((m) => (
                m.photoURL ? (
                  <img key={m.userId} src={m.photoURL} alt={m.displayName} className={styles.memberAvatar} referrerPolicy="no-referrer" title={m.displayName} />
                ) : (
                  <span key={m.userId} className={styles.memberInitial} title={m.displayName}>{(m.displayName || '?')[0].toUpperCase()}</span>
                )
              ))}
            </div>
          )}
        </div>

        {isActive && (
          <div className={styles.tripDetails}>
            {/* Tab Bar */}
            <div className={tabStyles.tabBar}>
              {TABS.map((t) => (
                <button
                  key={t.key}
                  className={`${tabStyles.tab} ${activeTab === t.key ? tabStyles.tabActive : ''}`}
                  onClick={() => {
                    setActiveTab(t.key);
                    if (t.key === 'catches') loadTripCatches(trip);
                    if (t.key === 'photos') loadTripPhotos(trip.id);
                  }}
                >
                  {t.label}
                  {t.key === 'expenses' && (trip.expenses || []).length > 0 && (
                    <span className={tabStyles.tabBadge}>{trip.expenses.length}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <TripOverview
                trip={trip} user={user}
                tripWeather={tripWeather[trip.id]}
                loadingWeather={loadingWeather[trip.id]}
                onLoadWeather={() => loadTripWeather(trip)}
                onEdit={() => startEditing(trip)}
                onManageMembers={() => setManagingMembers(managingMembers === trip.id ? null : trip.id)}
                onComplete={() => handleCompleteTrip(trip)}
                onDelete={() => handleDeleteTrip(trip)}
                managingMembers={managingMembers === trip.id}
                friendProfiles={friendProfiles}
                onAddMember={(f) => handleAddMember(trip, f)}
                onRemoveMember={(memberId) => handleRemoveMember(trip, memberId)}
              />
            )}

            {activeTab === 'itinerary' && (
              <TripItinerary
                trip={trip} user={user}
                onAddItem={(item) => handleAddItineraryItem(trip.id, item)}
                onRemoveItem={(itemId) => handleRemoveItineraryItem(trip.id, itemId)}
              />
            )}

            {activeTab === 'expenses' && (
              <TripExpenses
                trip={trip} user={user}
                onAddExpense={(expense) => handleAddExpense(trip.id, expense)}
                onRemoveExpense={(expenseId) => handleRemoveExpense(trip.id, expenseId)}
                toast={toast}
              />
            )}

            {activeTab === 'photos' && (
              <TripPhotos
                trip={trip} user={user}
                photos={tripPhotos[trip.id]}
                onLoadPhotos={() => loadTripPhotos(trip.id)}
                onUploadPhoto={(img, cap) => handleUploadPhoto(trip.id, img, cap)}
                onDeletePhoto={(photo) => handleDeletePhoto(trip.id, photo)}
                uploadingPhoto={uploadingPhoto}
                toast={toast}
              />
            )}

            {activeTab === 'catches' && (
              <TripCatches
                trip={trip}
                catches={tripCatches[trip.id]}
                loading={loadingCatches[trip.id]}
                stats={computeTripStats(tripCatches[trip.id])}
              />
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Trip Planner</h2>
      <UpgradePrompt feature="tripPlanner" featureLabel="Trip Planner">

      <button className={styles.addBtn} onClick={() => { setShowForm(!showForm); setActiveTrip(null); }}>
        {showForm ? 'Cancel' : '+ Plan a Trip'}
      </button>

      {showForm && (
        <form className={styles.form} onSubmit={handleCreateTrip}>
          <input className={styles.input} placeholder="Trip name (e.g. Weekend at Lake Fork)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Destination</label>
            <select className={styles.select} onChange={handleSpotSelect} defaultValue="">
              <option value="" disabled>Pick a saved spot or use GPS</option>
              <option value="__gps__">Use Current Location (GPS)</option>
              {spots.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input className={styles.input} placeholder="Or type a location..." value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
          </div>
          <div className={styles.row}>
            <div className={styles.fieldGroup}><label className={styles.label}>Arrival</label><input type="datetime-local" className={styles.input} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div className={styles.fieldGroup}><label className={styles.label}>Departure</label><input type="datetime-local" className={styles.input} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
          </div>
          <div className={styles.fieldGroup}><label className={styles.label}>Target Species</label><input className={styles.input} placeholder="e.g. Largemouth Bass" value={form.targetSpecies} onChange={(e) => setForm({ ...form, targetSpecies: e.target.value })} /></div>
          <div className={styles.inviteSection}>
            <span className={styles.inviteLabel}>Invite Friends {friendProfiles.length > 0 && `(${invitedIds.length} selected)`}</span>
            {friendProfiles.length > 0 ? (
              <div className={styles.inviteList}>
                {friendProfiles.map((f) => (
                  <label key={f.id} className={`${styles.inviteItem} ${invitedIds.includes(f.id) ? styles.inviteSelected : ''}`}>
                    <input type="checkbox" checked={invitedIds.includes(f.id)} onChange={() => setInvitedIds((prev) => prev.includes(f.id) ? prev.filter((x) => x !== f.id) : [...prev, f.id])} className={styles.inviteCheckbox} />
                    {f.photoURL ? <img src={f.photoURL} alt="" className={styles.inviteAvatar} referrerPolicy="no-referrer" /> : <span className={styles.inviteInitial}>{(f.displayName || '?')[0].toUpperCase()}</span>}
                    <span className={styles.inviteName}>{f.displayName || 'Angler'}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className={styles.noFriends}><Link to="/friends" className={styles.noFriendsLink}>Add friends</Link> to invite them on trips</p>
            )}
          </div>
          <button type="submit" className={styles.submitBtn} disabled={saving}>{saving ? 'Saving...' : 'Create Trip'}</button>
        </form>
      )}

      {planned.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Upcoming Trips</h3>
          {planned.map(renderTripCard)}
        </div>
      )}

      {completed.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Past Trips</h3>
          {completed.map(renderTripCard)}
        </div>
      )}

      {trips.length === 0 && !showForm && (
        <p className={styles.empty}>No trips planned yet. Tap above to plan one!</p>
      )}

      </UpgradePrompt>
    </div>
  );
}
