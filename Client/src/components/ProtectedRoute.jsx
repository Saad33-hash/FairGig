import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ROLE_HOME = {
  worker: '/app/worker/dashboard',
  verifier: '/app/verifier/queue',
  advocate: '/app/advocate/dashboard',
};

export default function ProtectedRoute({ children, allowedRoles }) {
  const { token, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--bg) text-sm text-(--muted)">
        Verifying your session...
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role] ?? '/login'} replace />;
  }

  return children;
}
