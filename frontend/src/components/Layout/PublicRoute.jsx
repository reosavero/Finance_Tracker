import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AuthLoadingScreen } from './ProtectedRoute';

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <AuthLoadingScreen />;

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children || <Outlet />;
};

export default PublicRoute;
