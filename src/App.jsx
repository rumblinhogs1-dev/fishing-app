import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import Navbar from './components/Navbar';
import OfflineBanner from './components/OfflineBanner';
import ToastContainer from './components/Toast';
import SearchModal from './components/SearchModal';
import { SkeletonList } from './components/Skeleton';
import { useCatchesProvider } from './hooks/useCatchesProvider';
import { useSpots } from './hooks/useSpots';
import { useTackleBox } from './hooks/useTackleBox';
import { useAuth } from './contexts/AuthContext';
import styles from './App.module.css';

const CatchList = lazy(() => import('./components/CatchList'));
const CatchForm = lazy(() => import('./components/CatchForm'));
const Stats = lazy(() => import('./components/Stats'));
const Insights = lazy(() => import('./components/Insights'));
const FishIdentify = lazy(() => import('./components/FishIdentify'));
const LureIdentify = lazy(() => import('./components/LureIdentify'));
const LureRecommendations = lazy(() => import('./components/LureRecommendations'));
const AuthPage = lazy(() => import('./components/AuthPage'));
const DataMigration = lazy(() => import('./components/DataMigration'));
const ActivityFeed = lazy(() => import('./components/ActivityFeed'));
const CatchDetail = lazy(() => import('./components/CatchDetail'));
const UserProfile = lazy(() => import('./components/UserProfile'));
const FriendsList = lazy(() => import('./components/FriendsList'));
const ProfileSettings = lazy(() => import('./components/ProfileSettings'));
const ChatPage = lazy(() => import('./components/ChatPage'));
const ChatRoom = lazy(() => import('./components/ChatRoom'));
const CreateGroup = lazy(() => import('./components/CreateGroup'));
const GroupSettings = lazy(() => import('./components/GroupSettings'));
const Regulations = lazy(() => import('./components/Regulations'));
const MapView = lazy(() => import('./components/MapView'));
const Forecast = lazy(() => import('./components/Forecast'));
const SpotsList = lazy(() => import('./components/SpotsList'));
const Leaderboard = lazy(() => import('./components/Leaderboard'));
const TackleBox = lazy(() => import('./components/TackleBox'));
const TripPlanner = lazy(() => import('./components/TripPlanner'));
const ConservationGuide = lazy(() => import('./components/ConservationGuide'));

function EditPage({ getCatch, updateCatch }) {
  const { id } = useParams();
  const entry = getCatch(id);

  if (!entry) return <p style={{ textAlign: 'center', padding: '2rem' }}>Catch not found.</p>;

  return <CatchForm existing={entry} onSubmit={(data) => updateCatch(id, data)} />;
}

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const { catches, loading: dataLoading, addCatch, updateCatch, deleteCatch, getCatch, isAuthenticated } = useCatchesProvider();
  const { spots } = useSpots();
  const { items: tackleItems } = useTackleBox();
  const [showMigration, setShowMigration] = useState(true);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch((prev) => !prev);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (authLoading) {
    return (
      <div className={styles.app}>
        <Navbar onSearchOpen={() => setShowSearch(true)} />
        <main className={styles.main}>
          <SkeletonList count={2} />
        </main>
      </div>
    );
  }

  return (
    <div className={styles.app}>
      <Navbar onSearchOpen={() => setShowSearch(true)} />
      <OfflineBanner />
      <ToastContainer />
      {isAuthenticated && showMigration && (
        <Suspense fallback={null}>
          <DataMigration userId={user.uid} onComplete={() => setShowMigration(false)} />
        </Suspense>
      )}
      <main className={styles.main}>
        {dataLoading ? (
          <SkeletonList count={3} />
        ) : (
          <Suspense fallback={<SkeletonList count={3} />}>
            <Routes>
              <Route path="/" element={<CatchList catches={catches} onDelete={deleteCatch} />} />
              <Route path="/add" element={<CatchForm onSubmit={addCatch} />} />
              <Route path="/edit/:id" element={<EditPage getCatch={getCatch} updateCatch={updateCatch} />} />
              <Route path="/identify" element={<FishIdentify />} />
              <Route path="/identify-lure" element={<LureIdentify />} />
              <Route path="/recommendations" element={<LureRecommendations />} />
              <Route path="/stats" element={<Stats catches={catches} />} />
              <Route path="/insights" element={<Insights catches={catches} />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/feed" element={<ActivityFeed />} />
              <Route path="/catch/:id" element={<CatchDetail />} />
              <Route path="/user/:userId" element={<UserProfile />} />
              <Route path="/friends" element={<FriendsList />} />
              <Route path="/settings" element={<ProfileSettings />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/chat/new" element={<CreateGroup />} />
              <Route path="/chat/:groupId" element={<ChatRoom />} />
              <Route path="/chat/:groupId/settings" element={<GroupSettings />} />
              <Route path="/map" element={<MapView catches={catches} />} />
              <Route path="/spots" element={<SpotsList />} />
              <Route path="/forecast" element={<Forecast />} />
              <Route path="/regulations" element={<Regulations />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/tackle" element={<TackleBox />} />
              <Route path="/trips" element={<TripPlanner />} />
              <Route path="/conservation" element={<ConservationGuide />} />
            </Routes>
          </Suspense>
        )}
      </main>
      {showSearch && (
        <SearchModal
          catches={catches}
          spots={spots}
          tackleItems={tackleItems}
          onClose={() => setShowSearch(false)}
        />
      )}
    </div>
  );
}
