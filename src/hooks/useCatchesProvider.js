import { useAuth } from '../contexts/AuthContext';
import { useCatches } from './useCatches';
import { useFirestoreCatches } from './useFirestoreCatches';

export function useCatchesProvider() {
  const { user } = useAuth();
  const localCatches = useCatches();
  const firestoreCatches = useFirestoreCatches(user);

  if (user) {
    return {
      catches: firestoreCatches.catches,
      loading: firestoreCatches.loading,
      addCatch: firestoreCatches.addCatch,
      updateCatch: firestoreCatches.updateCatch,
      deleteCatch: firestoreCatches.deleteCatch,
      getCatch: firestoreCatches.getCatch,
      isAuthenticated: true,
    };
  }

  return {
    catches: localCatches.catches,
    loading: false,
    addCatch: localCatches.addCatch,
    updateCatch: localCatches.updateCatch,
    deleteCatch: localCatches.deleteCatch,
    getCatch: localCatches.getCatch,
    isAuthenticated: false,
  };
}
