import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="brutal-card-sm flex flex-col items-center gap-3 animate-pop">
          <div className="w-10 h-10 border-3 border-navy border-t-primary rounded-full animate-spin" />
          <p className="text-navy/50 text-sm font-bold">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
};

export default ProtectedRoute;
