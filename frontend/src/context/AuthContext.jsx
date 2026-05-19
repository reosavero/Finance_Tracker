import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    authService.clearSession();
    setUser(null);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const token = authService.getToken();
      const storedUser = authService.getStoredUser();

      if (!token || !storedUser) {
        logout();
        setLoading(false);
        return;
      }

      try {
        // Validasi token ke backend agar token expired/tidak valid tidak bisa bypass route.
        const res = await authService.getProfile();
        const freshUser = res.data.data;
        authService.updateStoredUser(freshUser);
        setUser(freshUser);
      } catch (error) {
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [logout]);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    const { token, ...userData } = res.data;
    setUser(userData);
    return res;
  };

  const register = async (data) => {
    const res = await authService.register(data);
    const { token, ...userData } = res.data;
    setUser(userData);
    return res;
  };

  const updateUser = (userData) => {
    setUser(userData);
    authService.updateStoredUser(userData);
  };

  const value = useMemo(() => ({
    user,
    loading,
    isAuthenticated: Boolean(user && authService.getToken()),
    login,
    register,
    logout,
    updateUser,
  }), [user, loading, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
