import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useParams, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import OfflineBanner from './components/OfflineBanner';
import ToastContainer from './components/Toast';
import SearchModal from './components/SearchModal';
import ErrorBoundary from './components/ErrorBoundary';
import { SkeletonList } from './components/Skeleton';
import { getOnboardingState } from './utils/onboarding';
import { useCatchesProvider } from './hooks/useCatchesProvider';
import { useSpots } from './hooks/useSpots';
import { useAuth } from './contexts/AuthContext';
import styles from './App.module.css';

const ProtectedRoute = lazyRetry(() => import('./components/ProtectedRoute'));

// Retry dynamic imports once, then reload page to bust stale service worker cache
function lazyRetry(importFn) {
  return lazy(() =>
    importFn().catch(() => {
      // If chunk fails to load (stale SW cache), reload the page once
      const key = 'chunk-reload';
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        window.location.reload();
        return new Promise(() => {}); // never resolves — page is reloading
      }
      sessionStorage.removeItem(key);
      return importFn(); // retry once after reload flag is set
    })
  );
}

const CatchList = lazyRetry(() => import('./components/CatchList'));
const CatchForm = lazyRetry(() => import('./components/CatchForm'));
const Stats = lazyRetry(() => import('./components/Stats'));
const Insights = lazyRetry(() => import('./components/Insights'));
const FishIdentify = lazyRetry(() => import('./components/FishIdentify'));
const LureIdentify = lazyRetry(() => import('./components/LureIdentify'));
const LureRecommendations = lazyRetry(() => import('./components/LureRecommendations'));
const AuthPage = lazyRetry(() => import('./components/AuthPage'));
const DataMigration = lazyRetry(() => import('./components/DataMigration'));
const ActivityFeed = lazyRetry(() => import('./components/ActivityFeed'));
const CatchDetail = lazyRetry(() => import('./components/CatchDetail'));
const UserProfile = lazyRetry(() => import('./components/UserProfile'));
const FriendsList = lazyRetry(() => import('./components/FriendsList'));
const ProfileSettings = lazyRetry(() => import('./components/ProfileSettings'));
const ChatPage = lazyRetry(() => import('./components/ChatPage'));
const ChatRoom = lazyRetry(() => import('./components/ChatRoom'));
const CreateGroup = lazyRetry(() => import('./components/CreateGroup'));
const GroupSettings = lazyRetry(() => import('./components/GroupSettings'));
const Regulations = lazyRetry(() => import('./components/Regulations'));
const MapView = lazyRetry(() => import('./components/MapView'));
const Forecast = lazyRetry(() => import('./components/Forecast'));
const SpotsList = lazyRetry(() => import('./components/SpotsList'));
const Leaderboard = lazyRetry(() => import('./components/Leaderboard'));
const TripPlanner = lazyRetry(() => import('./components/TripPlanner'));
const ConservationGuide = lazyRetry(() => import('./components/ConservationGuide'));
const Notifications = lazyRetry(() => import('./components/Notifications'));
const Challenges = lazyRetry(() => import('./components/Challenges'));
const ChallengeDetail = lazyRetry(() => import('./components/ChallengeDetail'));
const LocalGuide = lazyRetry(() => import('./components/LocalGuide'));
const SonarImport = lazyRetry(() => import('./components/SonarImport'));
const WelcomeModal = lazyRetry(() => import('./components/WelcomeModal'));
const TermsPage = lazyRetry(() => import('./components/TermsPage'));
const PrivacyPolicy = lazyRetry(() => import('./components/PrivacyPolicy'));
const PricingPage = lazyRetry(() => import('./components/PricingPage'));

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
  const [showMigration, setShowMigration] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [showWelcome, setShowWelcome] = useState(() => {
    const s = getOnboardingState();
    return !s || !s.welcomed;
  });

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
      {isAuthenticated && showWelcome && !dataLoading && catches.length === 0 && (
        <Suspense fallback={null}>
          <WelcomeModal onDismiss={() => setShowWelcome(false)} />
        </Suspense>
      )}
      <main className={styles.main}>
        {dataLoading ? (
          <SkeletonList count={3} />
        ) : (
          <ErrorBoundary>
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
                <Route path="/map" element={<MapView catches={catches} />} />
                <Route path="/forecast" element={<Forecast />} />
                <Route path="/regulations" element={<Regulations />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/conservation" element={<ConservationGuide />} />
                <Route path="/challenges" element={<Challenges />} />
                <Route path="/challenge/:id" element={<ChallengeDetail />} />
                <Route path="/local-guide" element={<LocalGuide />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/pricing" element={<PricingPage />} />

                {/* Auth-only routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/friends" element={<FriendsList />} />
                  <Route path="/settings" element={<ProfileSettings />} />
                  <Route path="/chat" element={<ChatPage />} />
                  <Route path="/chat/new" element={<CreateGroup />} />
                  <Route path="/chat/:groupId" element={<ChatRoom />} />
                  <Route path="/chat/:groupId/settings" element={<GroupSettings />} />
                  <Route path="/trips" element={<TripPlanner catches={catches} />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/import-sonar" element={<SonarImport />} />
                  <Route path="/spots" element={<SpotsList />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        )}
      </main>
      <Footer />
      {showSearch && (
        <SearchModal
          catches={catches}
          spots={spots}
          onClose={() => setShowSearch(false)}
        />
      )}
    </div>
  );
}
