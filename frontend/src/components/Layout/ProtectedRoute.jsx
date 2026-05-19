import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const AuthLoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-cream p-4">
    <div className="brutal-card-sm flex flex-col items-center gap-3 animate-pop">
      <div className="w-10 h-10 border-3 border-navy border-t-primary rounded-full animate-spin" />
      <div className="text-center">
        <p className="text-navy text-sm font-extrabold">Memeriksa sesi login...</p>
        <p className="text-navy/40 text-xs font-bold mt-1">Mohon tunggu sebentar</p>
      </div>
    </div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoadingScreen />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children || <Outlet />;
};

export default ProtectedRoute;
