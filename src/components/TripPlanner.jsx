import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFriends } from '../hooks/useFriends';
import { useSpots } from '../hooks/useSpots';
import { addTrip, updateTrip, deleteTrip, subscribeToTrips, backfillMemberIds, addMemberToTrip, removeMemberFromTrip, getTripCatches, addItineraryItem, removeItineraryItem, addExpense, removeExpense, subscribeToTripPhotos, addTripPhoto, deleteTripPhoto } from '../utils/trips';
import { uploadTripPhoto, deleteTripPhotoFile } from '../utils/firebaseStorage';
import { notifyTripInvite } from '../utils/notifications';
import { createTripChat, addMemberToGroup, removeMemberFromGroup } from '../utils/chat';
import { fetchForecastData } from '../utils/forecast';
import { useNavigate } from 'react-router-dom';
import { getGPSLocation, reverseGeocode, weatherEmoji } from '../utils/weather';
import { SkeletonCard } from './Skeleton';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import ImageUpload from './ImageUpload';
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

const EXPENSE_CATEGORIES = ['gas', 'lodging', 'bait', 'food', 'guide', 'gear', 'other'];

const EMPTY_EXPENSE = {
  description: '',
  amount: '',
  category: 'other',
};

export default function TripPlanner({ catches = [] }) {
  const { user } = useAuth();
  const { friendProfiles } = useFriends();
  const { spots } = useSpots();
  const toast = useToast();
  const confirm = useConfirm();
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
  const [itineraryForm, setItineraryForm] = useState({ time: '', description: '' });
  const [tripWeather, setTripWeather] = useState({});
  const [loadingWeather, setLoadingWeather] = useState({});
  // Expenses
  const [expenseForm, setExpenseForm] = useState(EMPTY_EXPENSE);
  const [expenseSplitIds, setExpenseSplitIds] = useState([]);
  // Photos
  const [tripPhotos, setTripPhotos] = useState({});
  const [photoUnsubs, setPhotoUnsubs] = useState({});
  const [photoImage, setPhotoImage] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
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
      // Create trip chat group
      try {
        const chatGroupId = await createTripChat(newId, form.name.trim(), invitedIds, user.uid);
        await updateTrip(newId, { chatGroupId });
      } catch (err) {
        console.error('Failed to create trip chat:', err);
      }
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
    const ok = await confirm(`Move "${trip.name}" to Past Trips?`);
    if (!ok) return;
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
      if (trip.chatGroupId) {
        addMemberToGroup(trip.chatGroupId, friendProfile.id).catch(() => {});
      }
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
      if (trip.chatGroupId) {
        removeMemberFromGroup(trip.chatGroupId, memberId).catch(() => {});
      }
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

  async function handleAddItineraryItem(tripId, e) {
    e.preventDefault();
    if (!itineraryForm.description.trim()) return;
    try {
      await addItineraryItem(tripId, {
        time: itineraryForm.time || null,
        description: itineraryForm.description.trim(),
      });
      setItineraryForm({ time: '', description: '' });
      toast.success('Item added');
    } catch (err) {
      console.error('Failed to add itinerary item:', err);
      toast.error('Failed to add item');
    }
  }

  async function handleRemoveItineraryItem(tripId, itemId) {
    try {
      await removeItineraryItem(tripId, itemId);
    } catch (err) {
      console.error('Failed to remove itinerary item:', err);
    }
  }

  function computeTripStats(catches) {
    if (!catches || catches.length === 0) return null;
    const speciesMap = {};
    let totalWeight = 0;
    let biggest = null;
    catches.forEach((c) => {
      if (c.species) {
        speciesMap[c.species] = (speciesMap[c.species] || 0) + 1;
      }
      if (c.weight) {
        totalWeight += Number(c.weight) || 0;
        if (!biggest || Number(c.weight) > Number(biggest.weight)) biggest = c;
      }
    });
    return {
      totalCatches: catches.length,
      speciesCount: Object.keys(speciesMap).length,
      biggest,
      totalWeight: Math.round(totalWeight * 100) / 100,
      speciesBreakdown: speciesMap,
    };
  }

  async function loadTripWeather(trip) {
    if (!trip.lat || !trip.lng || loadingWeather[trip.id]) return;
    setLoadingWeather((prev) => ({ ...prev, [trip.id]: true }));
    try {
      const data = await fetchForecastData(trip.lat, trip.lng);
      // Filter forecast days to trip date range
      let days = data.days || [];
      if (trip.date) {
        const start = trip.date.slice(0, 10);
        const end = trip.endDate ? trip.endDate.slice(0, 10) : start;
        days = days.filter((d) => d.date >= start && d.date <= end);
      }
      setTripWeather((prev) => ({ ...prev, [trip.id]: days }));
    } catch (err) {
      console.error('Failed to load weather:', err);
      setTripWeather((prev) => ({ ...prev, [trip.id]: [] }));
    } finally {
      setLoadingWeather((prev) => ({ ...prev, [trip.id]: false }));
    }
  }

  // ── Expense handlers ──

  async function handleAddExpense(tripId, trip, e) {
    e.preventDefault();
    if (!expenseForm.description.trim() || !expenseForm.amount) return;
    const amount = parseFloat(expenseForm.amount);
    if (isNaN(amount) || amount <= 0) { toast.error('Enter a valid amount'); return; }
    const splitWith = expenseSplitIds.length > 0 ? expenseSplitIds : [user.uid];
    const expense = {
      id: `exp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      description: expenseForm.description.trim(),
      amount: Math.round(amount * 100) / 100,
      category: expenseForm.category,
      paidByUserId: user.uid,
      paidByName: user.displayName || 'You',
      splitWithUserIds: splitWith,
      createdAt: new Date().toISOString(),
    };
    try {
      await addExpense(tripId, expense);
      setExpenseForm(EMPTY_EXPENSE);
      setExpenseSplitIds([]);
      toast.success('Expense added');
    } catch (err) {
      console.error('Failed to add expense:', err);
      toast.error('Failed to add expense');
    }
  }

  async function handleRemoveExpense(tripId, expenseId) {
    const ok = await confirm('Remove this expense?', { destructive: true });
    if (!ok) return;
    try {
      await removeExpense(tripId, expenseId);
    } catch (err) {
      console.error('Failed to remove expense:', err);
      toast.error('Failed to remove expense');
    }
  }

  function computeBalances(expenses, members) {
    const balances = {};
    (members || []).forEach((m) => { balances[m.userId] = 0; });
    (expenses || []).forEach((exp) => {
      const splitCount = exp.splitWithUserIds?.length || 1;
      const perPerson = exp.amount / splitCount;
      // Payer gets credit
      balances[exp.paidByUserId] = (balances[exp.paidByUserId] || 0) + exp.amount;
      // Everyone in the split owes their share
      (exp.splitWithUserIds || []).forEach((uid) => {
        balances[uid] = (balances[uid] || 0) - perPerson;
      });
    });
    return balances;
  }

  function computeSettlements(balances, members) {
    const memberMap = {};
    (members || []).forEach((m) => { memberMap[m.userId] = m.displayName || 'Angler'; });
    const debtors = []; // owe money (negative balance)
    const creditors = []; // are owed (positive balance)
    Object.entries(balances).forEach(([uid, bal]) => {
      const rounded = Math.round(bal * 100) / 100;
      if (rounded < -0.01) debtors.push({ uid, amount: -rounded });
      else if (rounded > 0.01) creditors.push({ uid, amount: rounded });
    });
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);
    const settlements = [];
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const pay = Math.min(debtors[i].amount, creditors[j].amount);
      if (pay > 0.01) {
        settlements.push({
          from: memberMap[debtors[i].uid] || debtors[i].uid,
          to: memberMap[creditors[j].uid] || creditors[j].uid,
          amount: Math.round(pay * 100) / 100,
        });
      }
      debtors[i].amount -= pay;
      creditors[j].amount -= pay;
      if (debtors[i].amount < 0.01) i++;
      if (creditors[j].amount < 0.01) j++;
    }
    return settlements;
  }

  // ── Photo handlers ──

  function loadTripPhotos(tripId) {
    if (tripPhotos[tripId] !== undefined) return; // already loaded / loading
    setTripPhotos((prev) => ({ ...prev, [tripId]: [] }));
    const unsub = subscribeToTripPhotos(tripId, (photos) => {
      setTripPhotos((prev) => ({ ...prev, [tripId]: photos }));
    });
    setPhotoUnsubs((prev) => ({ ...prev, [tripId]: unsub }));
  }

  // Cleanup photo subscriptions on unmount
  useEffect(() => {
    return () => {
      Object.values(photoUnsubs).forEach((unsub) => { if (unsub) unsub(); });
    };
  }, []);

  async function handleUploadPhoto(tripId) {
    if (!photoImage) return;
    setUploadingPhoto(true);
    try {
      const tempId = `photo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const imageUrl = await uploadTripPhoto(tripId, tempId, photoImage);
      await addTripPhoto(tripId, {
        imageUrl,
        caption: photoCaption.trim(),
        uploadedByUserId: user.uid,
        uploadedByName: user.displayName || 'Anonymous',
        uploadedByPhotoURL: user.photoURL || null,
        storageId: tempId,
      });
      setPhotoImage('');
      setPhotoCaption('');
      toast.success('Photo uploaded!');
    } catch (err) {
      console.error('Failed to upload photo:', err);
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleDeletePhoto(tripId, photo) {
    const ok = await confirm('Delete this photo?', { destructive: true });
    if (!ok) return;
    try {
      await deleteTripPhoto(tripId, photo.id);
      if (photo.storageId) {
        deleteTripPhotoFile(tripId, photo.storageId).catch(() => {});
      }
      setLightboxPhoto(null);
      toast.success('Photo deleted');
    } catch (err) {
      console.error('Failed to delete photo:', err);
      toast.error('Failed to delete photo');
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
                        <button className={styles.completeBtn} onClick={() => handleCompleteTrip(trip)} title="Mark trip as completed">
                          Complete Trip
                        </button>
                        <button className={styles.tripDeleteBtn} onClick={() => deleteTrip(trip.id)} title="Delete">
                          &times;
                        </button>
                      </div>
                      {trip.chatGroupId && (
                        <Link to={`/chat/${trip.chatGroupId}`} className={styles.tripChatBtn}>
                          Trip Chat
                        </Link>
                      )}
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
                      {/* Itinerary */}
                      <div className={styles.itinerarySection}>
                        <h5 className={styles.panelTitle}>Itinerary</h5>
                        {(trip.itinerary || [])
                          .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
                          .map((item) => (
                            <div key={item.id} className={styles.itineraryItem}>
                              {item.time && (
                                <span className={styles.itineraryTime}>
                                  {new Date(item.time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                </span>
                              )}
                              <span className={styles.itineraryDesc}>{item.description}</span>
                              {trip.userId === user.uid && (
                                <button className={styles.itineraryRemoveBtn} onClick={() => handleRemoveItineraryItem(trip.id, item.id)}>&times;</button>
                              )}
                            </div>
                          ))}
                        {trip.userId === user.uid && (
                          <form className={styles.itineraryForm} onSubmit={(e) => handleAddItineraryItem(trip.id, e)}>
                            <input
                              type="datetime-local"
                              className={styles.itineraryTimeInput}
                              value={itineraryForm.time}
                              onChange={(e) => setItineraryForm((f) => ({ ...f, time: e.target.value }))}
                            />
                            <input
                              className={styles.itineraryDescInput}
                              placeholder="Add activity..."
                              value={itineraryForm.description}
                              onChange={(e) => setItineraryForm((f) => ({ ...f, description: e.target.value }))}
                            />
                            <button type="submit" className={styles.itineraryAddBtn} disabled={!itineraryForm.description.trim()}>+</button>
                          </form>
                        )}
                      </div>

                      {/* Weather */}
                      {trip.lat && trip.lng && (
                        <div className={styles.weatherSection}>
                          <h5 className={styles.panelTitle}>Weather Forecast</h5>
                          {tripWeather[trip.id] ? (
                            tripWeather[trip.id].length > 0 ? (
                              <div className={styles.weatherCards}>
                                {tripWeather[trip.id].map((day) => (
                                  <div key={day.date} className={styles.weatherCard}>
                                    <span className={styles.weatherEmoji}>{weatherEmoji(day.weatherCode)}</span>
                                    <span className={styles.weatherDate}>
                                      {new Date(day.date + 'T12:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </span>
                                    <span className={styles.weatherTemp}>{day.tempMin}&deg; - {day.tempMax}&deg;F</span>
                                    {day.windMax != null && <span className={styles.weatherWind}>Wind: {day.windMax} mph</span>}
                                    {day.precip > 0 && <span className={styles.weatherPrecip}>Precip: {day.precip}&Prime;</span>}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className={styles.noCatches}>No forecast data for trip dates (only available within 5 days).</p>
                            )
                          ) : (
                            <button
                              className={styles.loadWeatherBtn}
                              onClick={() => loadTripWeather(trip)}
                              disabled={loadingWeather[trip.id]}
                            >
                              {loadingWeather[trip.id] ? 'Loading...' : 'Load Forecast'}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Expenses */}
                      <div className={styles.expensesSection}>
                        <h5 className={styles.panelTitle}>Shared Expenses</h5>
                        {(trip.expenses || []).length > 0 && (
                          <>
                            {trip.expenses.map((exp) => (
                              <div key={exp.id} className={styles.expenseItem}>
                                <span className={styles.expenseCategoryTag}>{exp.category}</span>
                                <span className={styles.expenseDesc}>{exp.description}</span>
                                <span className={styles.expenseAmount}>${exp.amount.toFixed(2)}</span>
                                <span className={styles.expensePaidBy}>{exp.paidByName}</span>
                                <button className={styles.expenseRemoveBtn} onClick={() => handleRemoveExpense(trip.id, exp.id)}>&times;</button>
                              </div>
                            ))}
                            {(() => {
                              const balances = computeBalances(trip.expenses, trip.members);
                              const settlements = computeSettlements(balances, trip.members);
                              const total = trip.expenses.reduce((s, e) => s + e.amount, 0);
                              return (
                                <div className={styles.balanceSummary}>
                                  <h6 className={styles.balanceSummaryTitle}>Settlement</h6>
                                  {settlements.length > 0 ? settlements.map((s, i) => (
                                    <div key={i} className={styles.settlementRow}>
                                      <span>{s.from}</span>
                                      <span>owes</span>
                                      <span>{s.to}</span>
                                      <span className={styles.settlementAmount}>${s.amount.toFixed(2)}</span>
                                    </div>
                                  )) : (
                                    <p className={styles.noSettlements}>All settled up!</p>
                                  )}
                                  <p className={styles.expenseTotal}>Total: ${total.toFixed(2)}</p>
                                </div>
                              );
                            })()}
                          </>
                        )}
                        <form className={styles.expenseForm} onSubmit={(e) => handleAddExpense(trip.id, trip, e)}>
                          <div className={styles.expenseFormRow}>
                            <input
                              className={styles.expenseFormInput}
                              placeholder="Description"
                              value={expenseForm.description}
                              onChange={(e) => setExpenseForm((f) => ({ ...f, description: e.target.value }))}
                            />
                            <input
                              className={styles.expenseFormInput}
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="Amount"
                              value={expenseForm.amount}
                              onChange={(e) => setExpenseForm((f) => ({ ...f, amount: e.target.value }))}
                            />
                          </div>
                          <div className={styles.expenseFormRow}>
                            <select
                              className={styles.expenseFormSelect}
                              value={expenseForm.category}
                              onChange={(e) => setExpenseForm((f) => ({ ...f, category: e.target.value }))}
                            >
                              {EXPENSE_CATEGORIES.map((c) => (
                                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                              ))}
                            </select>
                          </div>
                          {trip.members && trip.members.length > 1 && (
                            <div className={styles.splitCheckboxes}>
                              <span>Split with:</span>
                              {trip.members.map((m) => (
                                <label key={m.userId}>
                                  <input
                                    type="checkbox"
                                    checked={expenseSplitIds.includes(m.userId)}
                                    onChange={() => setExpenseSplitIds((prev) =>
                                      prev.includes(m.userId) ? prev.filter((id) => id !== m.userId) : [...prev, m.userId]
                                    )}
                                  />
                                  {m.displayName || 'Angler'}
                                </label>
                              ))}
                            </div>
                          )}
                          <button type="submit" className={styles.expenseAddBtn} disabled={!expenseForm.description.trim() || !expenseForm.amount}>
                            Add Expense
                          </button>
                        </form>
                      </div>

                      {/* Photos */}
                      <div className={styles.photosSection}>
                        <h5 className={styles.panelTitle}>Photos</h5>
                        {tripPhotos[trip.id] !== undefined ? (
                          <>
                            {tripPhotos[trip.id].length > 0 && (
                              <div className={styles.photoGrid}>
                                {tripPhotos[trip.id].map((photo) => (
                                  <div key={photo.id} className={styles.photoTile} onClick={() => setLightboxPhoto({ ...photo, tripId: trip.id })}>
                                    <img src={photo.imageUrl} alt={photo.caption || 'Trip photo'} loading="lazy" />
                                    {photo.caption && <span className={styles.photoTileCaption}>{photo.caption}</span>}
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className={styles.photoUploadForm}>
                              <ImageUpload image={photoImage} onChange={setPhotoImage} />
                              {photoImage && (
                                <>
                                  <input
                                    className={styles.photoCaptionInput}
                                    placeholder="Caption (optional)"
                                    value={photoCaption}
                                    onChange={(e) => setPhotoCaption(e.target.value)}
                                  />
                                  <button
                                    className={styles.photoUploadBtn}
                                    onClick={() => handleUploadPhoto(trip.id)}
                                    disabled={uploadingPhoto}
                                  >
                                    {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                                  </button>
                                </>
                              )}
                            </div>
                          </>
                        ) : (
                          <button className={styles.loadPhotosBtn} onClick={() => loadTripPhotos(trip.id)}>
                            Load Photos
                          </button>
                        )}
                      </div>
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
                  {/* Trip Stats */}
                  {tripCatches[trip.id] && tripCatches[trip.id].length > 0 && (() => {
                    const stats = computeTripStats(tripCatches[trip.id]);
                    if (!stats) return null;
                    return (
                      <div className={styles.statsGrid}>
                        <div className={styles.statItem}>
                          <span className={styles.statValue}>{stats.totalCatches}</span>
                          <span className={styles.statLabel}>Catches</span>
                        </div>
                        <div className={styles.statItem}>
                          <span className={styles.statValue}>{stats.speciesCount}</span>
                          <span className={styles.statLabel}>Species</span>
                        </div>
                        {stats.biggest && (
                          <div className={styles.statItem}>
                            <span className={styles.statValue}>{stats.biggest.weight} lbs</span>
                            <span className={styles.statLabel}>Biggest</span>
                          </div>
                        )}
                        {stats.totalWeight > 0 && (
                          <div className={styles.statItem}>
                            <span className={styles.statValue}>{stats.totalWeight} lbs</span>
                            <span className={styles.statLabel}>Total Weight</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

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

                  {/* Expenses */}
                  <div className={styles.expensesSection}>
                    <h5 className={styles.panelTitle}>Shared Expenses</h5>
                    {(trip.expenses || []).length > 0 && (
                      <>
                        {trip.expenses.map((exp) => (
                          <div key={exp.id} className={styles.expenseItem}>
                            <span className={styles.expenseCategoryTag}>{exp.category}</span>
                            <span className={styles.expenseDesc}>{exp.description}</span>
                            <span className={styles.expenseAmount}>${exp.amount.toFixed(2)}</span>
                            <span className={styles.expensePaidBy}>{exp.paidByName}</span>
                            <button className={styles.expenseRemoveBtn} onClick={() => handleRemoveExpense(trip.id, exp.id)}>&times;</button>
                          </div>
                        ))}
                        {(() => {
                          const balances = computeBalances(trip.expenses, trip.members);
                          const settlements = computeSettlements(balances, trip.members);
                          const total = trip.expenses.reduce((s, e) => s + e.amount, 0);
                          return (
                            <div className={styles.balanceSummary}>
                              <h6 className={styles.balanceSummaryTitle}>Settlement</h6>
                              {settlements.length > 0 ? settlements.map((s, i) => (
                                <div key={i} className={styles.settlementRow}>
                                  <span>{s.from}</span>
                                  <span>owes</span>
                                  <span>{s.to}</span>
                                  <span className={styles.settlementAmount}>${s.amount.toFixed(2)}</span>
                                </div>
                              )) : (
                                <p className={styles.noSettlements}>All settled up!</p>
                              )}
                              <p className={styles.expenseTotal}>Total: ${total.toFixed(2)}</p>
                            </div>
                          );
                        })()}
                      </>
                    )}
                    <form className={styles.expenseForm} onSubmit={(e) => handleAddExpense(trip.id, trip, e)}>
                      <div className={styles.expenseFormRow}>
                        <input
                          className={styles.expenseFormInput}
                          placeholder="Description"
                          value={expenseForm.description}
                          onChange={(e) => setExpenseForm((f) => ({ ...f, description: e.target.value }))}
                        />
                        <input
                          className={styles.expenseFormInput}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Amount"
                          value={expenseForm.amount}
                          onChange={(e) => setExpenseForm((f) => ({ ...f, amount: e.target.value }))}
                        />
                      </div>
                      <div className={styles.expenseFormRow}>
                        <select
                          className={styles.expenseFormSelect}
                          value={expenseForm.category}
                          onChange={(e) => setExpenseForm((f) => ({ ...f, category: e.target.value }))}
                        >
                          {EXPENSE_CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                          ))}
                        </select>
                      </div>
                      {trip.members && trip.members.length > 1 && (
                        <div className={styles.splitCheckboxes}>
                          <span>Split with:</span>
                          {trip.members.map((m) => (
                            <label key={m.userId}>
                              <input
                                type="checkbox"
                                checked={expenseSplitIds.includes(m.userId)}
                                onChange={() => setExpenseSplitIds((prev) =>
                                  prev.includes(m.userId) ? prev.filter((id) => id !== m.userId) : [...prev, m.userId]
                                )}
                              />
                              {m.displayName || 'Angler'}
                            </label>
                          ))}
                        </div>
                      )}
                      <button type="submit" className={styles.expenseAddBtn} disabled={!expenseForm.description.trim() || !expenseForm.amount}>
                        Add Expense
                      </button>
                    </form>
                  </div>

                  {/* Photos */}
                  <div className={styles.photosSection}>
                    <h5 className={styles.panelTitle}>Photos</h5>
                    {tripPhotos[trip.id] !== undefined ? (
                      <>
                        {tripPhotos[trip.id].length > 0 && (
                          <div className={styles.photoGrid}>
                            {tripPhotos[trip.id].map((photo) => (
                              <div key={photo.id} className={styles.photoTile} onClick={() => setLightboxPhoto({ ...photo, tripId: trip.id })}>
                                <img src={photo.imageUrl} alt={photo.caption || 'Trip photo'} loading="lazy" />
                                {photo.caption && <span className={styles.photoTileCaption}>{photo.caption}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className={styles.photoUploadForm}>
                          <ImageUpload image={photoImage} onChange={setPhotoImage} />
                          {photoImage && (
                            <>
                              <input
                                className={styles.photoCaptionInput}
                                placeholder="Caption (optional)"
                                value={photoCaption}
                                onChange={(e) => setPhotoCaption(e.target.value)}
                              />
                              <button
                                className={styles.photoUploadBtn}
                                onClick={() => handleUploadPhoto(trip.id)}
                                disabled={uploadingPhoto}
                              >
                                {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    ) : (
                      <button className={styles.loadPhotosBtn} onClick={() => loadTripPhotos(trip.id)}>
                        Load Photos
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {trips.length === 0 && !showForm && (
        <p className={styles.empty}>No trips planned yet. Tap above to plan one!</p>
      )}

      {/* Lightbox */}
      {lightboxPhoto && (
        <div className={styles.lightboxOverlay} onClick={() => setLightboxPhoto(null)}>
          <button className={styles.lightboxClose} onClick={() => setLightboxPhoto(null)}>&times;</button>
          <img
            className={styles.lightboxImg}
            src={lightboxPhoto.imageUrl}
            alt={lightboxPhoto.caption || 'Trip photo'}
            onClick={(e) => e.stopPropagation()}
          />
          <div className={styles.lightboxInfo} onClick={(e) => e.stopPropagation()}>
            {lightboxPhoto.caption && <span className={styles.lightboxCaption}>{lightboxPhoto.caption}</span>}
            <span className={styles.lightboxUploader}>
              {lightboxPhoto.uploadedByPhotoURL && (
                <img src={lightboxPhoto.uploadedByPhotoURL} alt="" className={styles.lightboxUploaderAvatar} referrerPolicy="no-referrer" />
              )}
              {lightboxPhoto.uploadedByName}
            </span>
            {lightboxPhoto.uploadedByUserId === user.uid && (
              <button
                className={styles.lightboxDeleteBtn}
                onClick={() => handleDeletePhoto(lightboxPhoto.tripId, lightboxPhoto)}
              >
                Delete Photo
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
