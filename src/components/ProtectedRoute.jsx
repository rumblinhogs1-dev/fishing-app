import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SkeletonList } from './Skeleton';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) return <SkeletonList count={2} />;
  if (!user) return <Navigate to="/auth" replace />;
  return <Outlet />;
}
