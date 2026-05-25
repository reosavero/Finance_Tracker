import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import SummaryCards from '../components/Dashboard/SummaryCards';
import CategoryChart from '../components/Dashboard/CategoryChart';
import QuickInput from '../components/Dashboard/QuickInput';
import RecentTransactions from '../components/Dashboard/RecentTransactions';
import UpcomingBills from '../components/Dashboard/UpcomingBills';
import WelcomeModal from '../components/Dashboard/WelcomeModal';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await api.get('/dashboard/summary', {
        params: { _t: Date.now() },
      });
      setData(res.data.data);

      // Tampilkan WelcomeModal jika uang bulanan = 0 (user baru)
      if (Number(res.data.data.monthly_allowance) === 0 && !isRefresh) {
        setShowWelcome(true);
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const handleRefresh = useCallback(async () => {
    await fetchDashboard(true);
  }, [fetchDashboard]);

  const handleWelcomeComplete = useCallback(async () => {
    setShowWelcome(false);
    // Refresh dashboard data setelah welcome selesai
    await fetchDashboard(true);
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="brutal-card-sm flex flex-col items-center gap-3 animate-pop">
          <div className="w-10 h-10 border-3 border-navy border-t-primary rounded-full animate-spin" />
          <p className="text-navy/50 text-sm font-bold">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return '🌅 Selamat Pagi';
    if (h < 17) return '☀️ Selamat Siang';
    return '🌙 Selamat Malam';
  };

  return (
    <div className="space-y-6">
      {/* Welcome Modal untuk user baru */}
      <WelcomeModal
        isOpen={showWelcome}
        onClose={() => setShowWelcome(false)}
        onComplete={handleWelcomeComplete}
      />

      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl md:text-3xl font-bold text-navy">
          {greeting()},{' '}
          <span className="bg-secondary px-2 py-0.5 border-2 border-navy rounded-lg inline-block -rotate-1">
            {user?.name?.split(' ')[0]}
          </span>
        </h1>
        <p className="text-navy/40 text-sm font-medium mt-2">
          📅 Ringkasan keuanganmu bulan {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Summary Cards */}
      <SummaryCards data={data} refreshing={refreshing} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Chart + Recent */}
        <div className="lg:col-span-2 space-y-6">
          <CategoryChart data={data?.category_breakdown} />
          <RecentTransactions transactions={data?.recent_transactions} />
        </div>

        {/* Right: Quick Input + Bills */}
        <div className="space-y-6">
          <QuickInput onSuccess={handleRefresh} />
          <UpcomingBills bills={data?.upcoming_bills} onPaySuccess={handleRefresh} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;