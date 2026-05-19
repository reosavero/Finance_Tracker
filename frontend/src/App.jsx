import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './components/Layout/AppLayout';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import PublicRoute from './components/Layout/PublicRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budget from './pages/Budget';
import Bills from './pages/Bills';
import Categories from './pages/Categories';
import Profile from './pages/Profile';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#FFFFFF',
              color: '#1A1A2E',
              border: '3px solid #1A1A2E',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '700',
              fontFamily: '"Space Grotesk", sans-serif',
              boxShadow: '4px 4px 0px #1A1A2E',
            },
            success: { iconTheme: { primary: '#06D6A0', secondary: '#fff' } },
            error: { iconTheme: { primary: '#EF476F', secondary: '#fff' } },
          }}
        />

        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/budget" element={<Budget />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/bills" element={<Bills />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
