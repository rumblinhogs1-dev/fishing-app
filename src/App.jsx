import { useState } from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import Navbar from './components/Navbar';
import CatchList from './components/CatchList';
import CatchForm from './components/CatchForm';
import Stats from './components/Stats';
import FishIdentify from './components/FishIdentify';
import LureIdentify from './components/LureIdentify';
import LureRecommendations from './components/LureRecommendations';
import AuthPage from './components/AuthPage';
import DataMigration from './components/DataMigration';
import ActivityFeed from './components/ActivityFeed';
import CatchDetail from './components/CatchDetail';
import UserProfile from './components/UserProfile';
import FriendsList from './components/FriendsList';
import ProfileSettings from './components/ProfileSettings';
import ChatPage from './components/ChatPage';
import ChatRoom from './components/ChatRoom';
import CreateGroup from './components/CreateGroup';
import GroupSettings from './components/GroupSettings';
import Regulations from './components/Regulations';
import { useCatchesProvider } from './hooks/useCatchesProvider';
import { useAuth } from './contexts/AuthContext';
import styles from './App.module.css';

function EditPage({ getCatch, updateCatch }) {
  const { id } = useParams();
  const entry = getCatch(id);

  if (!entry) return <p style={{ textAlign: 'center', padding: '2rem' }}>Catch not found.</p>;

  return <CatchForm existing={entry} onSubmit={(data) => updateCatch(id, data)} />;
}

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const { catches, loading: dataLoading, addCatch, updateCatch, deleteCatch, getCatch, isAuthenticated } = useCatchesProvider();
  const [showMigration, setShowMigration] = useState(true);

  if (authLoading) {
    return (
      <div className={styles.app}>
        <Navbar />
        <main className={styles.main}>
          <p style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.app}>
      <Navbar />
      {isAuthenticated && showMigration && (
        <DataMigration userId={user.uid} onComplete={() => setShowMigration(false)} />
      )}
      <main className={styles.main}>
        {dataLoading ? (
          <p style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>Loading your catches...</p>
        ) : (
          <Routes>
            <Route path="/" element={<CatchList catches={catches} onDelete={deleteCatch} />} />
            <Route path="/add" element={<CatchForm onSubmit={addCatch} />} />
            <Route path="/edit/:id" element={<EditPage getCatch={getCatch} updateCatch={updateCatch} />} />
            <Route path="/identify" element={<FishIdentify />} />
            <Route path="/identify-lure" element={<LureIdentify />} />
            <Route path="/recommendations" element={<LureRecommendations />} />
            <Route path="/stats" element={<Stats catches={catches} />} />
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
            <Route path="/regulations" element={<Regulations />} />
          </Routes>
        )}
      </main>
    </div>
  );
}
