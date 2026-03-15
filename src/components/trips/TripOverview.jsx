import { Link } from 'react-router-dom';
import { weatherEmoji } from '../../utils/weather';
import styles from './TripTabs.module.css';

export default function TripOverview({ trip, user, tripWeather, loadingWeather, onLoadWeather, onEdit, onManageMembers, onComplete, onDelete, managingMembers, friendProfiles, onAddMember, onRemoveMember }) {
  const isCreator = trip.userId === user.uid;

  return (
    <div className={styles.tabContent}>
      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <button className={styles.actionBtn} onClick={onEdit}>Edit</button>
        {trip.chatGroupId && (
          <Link to={`/chat/${trip.chatGroupId}`} className={styles.actionBtnPrimary}>Trip Chat</Link>
        )}
        {trip.destination && (
          <Link to={`/local-guide?location=${encodeURIComponent(trip.destination)}`} className={styles.actionBtn}>Local Guide</Link>
        )}
        {trip.status === 'planned' && (
          <button className={styles.actionBtnGreen} onClick={onComplete}>Complete Trip</button>
        )}
        {isCreator && (
          <button className={styles.actionBtnDanger} onClick={onDelete}>Delete</button>
        )}
      </div>

      {/* Trip Info Card */}
      <div className={styles.infoCard}>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Destination</span>
          <span className={styles.infoValue}>{trip.destination || 'Not set'}</span>
        </div>
        {trip.date && (
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Dates</span>
            <span className={styles.infoValue}>
              {new Date(trip.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              {trip.endDate && ` \u2192 ${new Date(trip.endDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`}
            </span>
          </div>
        )}
        {trip.targetSpecies && (
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Target</span>
            <span className={styles.speciesTag}>{trip.targetSpecies}</span>
          </div>
        )}
      </div>

      {/* Members */}
      <div className={styles.membersCard}>
        <div className={styles.membersHeader}>
          <h4 className={styles.cardTitle}>Crew ({(trip.members || []).length})</h4>
          {isCreator && (
            <button className={styles.smallBtn} onClick={onManageMembers}>
              {managingMembers ? 'Done' : 'Manage'}
            </button>
          )}
        </div>
        <div className={styles.membersList}>
          {(trip.members || []).map((m) => (
            <div key={m.userId} className={styles.memberChip}>
              {m.photoURL ? (
                <img src={m.photoURL} alt="" className={styles.memberChipAvatar} referrerPolicy="no-referrer" />
              ) : (
                <span className={styles.memberChipInitial}>{(m.displayName || '?')[0].toUpperCase()}</span>
              )}
              <span className={styles.memberChipName}>{m.displayName || 'Angler'}</span>
              {managingMembers && m.userId !== user.uid && (
                <button className={styles.memberRemoveX} onClick={() => onRemoveMember(m.userId)}>&times;</button>
              )}
            </div>
          ))}
        </div>
        {managingMembers && friendProfiles.filter((f) => !(trip.memberIds || []).includes(f.id)).length > 0 && (
          <div className={styles.inviteSection}>
            <span className={styles.inviteLabel}>Invite</span>
            {friendProfiles
              .filter((f) => !(trip.memberIds || []).includes(f.id))
              .map((f) => (
                <div key={f.id} className={styles.memberChip}>
                  {f.photoURL ? (
                    <img src={f.photoURL} alt="" className={styles.memberChipAvatar} referrerPolicy="no-referrer" />
                  ) : (
                    <span className={styles.memberChipInitial}>{(f.displayName || '?')[0].toUpperCase()}</span>
                  )}
                  <span className={styles.memberChipName}>{f.displayName || 'Angler'}</span>
                  <button className={styles.inviteChipBtn} onClick={() => onAddMember(f)}>+</button>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Weather */}
      {trip.lat && trip.lng && (
        <div className={styles.weatherCard}>
          <h4 className={styles.cardTitle}>Weather</h4>
          {tripWeather ? (
            tripWeather.length > 0 ? (
              <div className={styles.weatherGrid}>
                {tripWeather.map((day) => (
                  <div key={day.date} className={styles.weatherDay}>
                    <span className={styles.weatherEmoji}>{weatherEmoji(day.weatherCode)}</span>
                    <span className={styles.weatherDate}>
                      {new Date(day.date + 'T12:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <span className={styles.weatherTemp}>{day.tempMin}&deg; - {day.tempMax}&deg;F</span>
                    {day.windMax != null && <span className={styles.weatherDetail}>Wind: {day.windMax} mph</span>}
                    {day.precip > 0 && <span className={styles.weatherDetail}>Rain: {day.precip}&Prime;</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.emptyText}>Forecast only available within 5 days of trip dates.</p>
            )
          ) : (
            <button className={styles.loadBtn} onClick={onLoadWeather} disabled={loadingWeather}>
              {loadingWeather ? 'Loading...' : 'Load Forecast'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
