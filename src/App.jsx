import { Routes, Route, useParams } from 'react-router-dom';
import Navbar from './components/Navbar';
import CatchList from './components/CatchList';
import CatchForm from './components/CatchForm';
import Stats from './components/Stats';
import FishIdentify from './components/FishIdentify';
import { useCatches } from './hooks/useCatches';
import styles from './App.module.css';

function EditPage({ getCatch, updateCatch }) {
  const { id } = useParams();
  const entry = getCatch(id);

  if (!entry) return <p style={{ textAlign: 'center', padding: '2rem' }}>Catch not found.</p>;

  return <CatchForm existing={entry} onSubmit={(data) => updateCatch(id, data)} />;
}

export default function App() {
  const { catches, addCatch, updateCatch, deleteCatch, getCatch } = useCatches();

  return (
    <div className={styles.app}>
      <Navbar />
      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<CatchList catches={catches} onDelete={deleteCatch} />} />
          <Route path="/add" element={<CatchForm onSubmit={addCatch} />} />
          <Route path="/edit/:id" element={<EditPage getCatch={getCatch} updateCatch={updateCatch} />} />
          <Route path="/identify" element={<FishIdentify />} />
          <Route path="/stats" element={<Stats catches={catches} />} />
        </Routes>
      </main>
    </div>
  );
}
