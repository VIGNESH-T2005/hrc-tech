import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// UX-only convenience: hides the wrong nav links for the wrong role.
// The real enforcement is server-side on every API call — this never substitutes for that.
export function ProtectedRoute({ role }) {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return <Outlet />;
}