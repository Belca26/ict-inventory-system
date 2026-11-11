import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import type { RoleName } from '@/types';

export function ProtectedRoute({ allowedRoles }: { allowedRoles?: RoleName[] }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null; // could render a splash/spinner here

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
