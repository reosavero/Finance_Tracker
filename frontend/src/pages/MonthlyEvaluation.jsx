import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import EvaluationSummaryCards from '../components/Evaluation/EvaluationSummaryCards';
import FinancialScoreCard from '../components/Evaluation/FinancialScoreCard';
import SpendingInsightCard from '../components/Evaluation/SpendingInsightCard';
import RecommendationCard from '../components/Evaluation/RecommendationCard';
import FinancialCharts from '../components/Evaluation/FinancialCharts';

const MonthlyEvaluation = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchEvaluation = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/evaluation/monthly', {
        params: { _t: Date.now() },
      });
      setData(res.data.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal memuat evaluasi keuangan';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvaluation(); }, [fetchEvaluation]);

  if (loading) return <EvaluationSkeleton />;
  if (error) return <EvaluationError message={error} onRetry={fetchEvaluation} />;
  if (!data) return <EvaluationEmpty />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl md:text-3xl font-bold text-navy">
          📊 Evaluasi Keuangan
        </h1>
        <p className="text-navy/40 text-sm font-medium mt-2">
          Analisis mendalam kondisi finansialmu bulan {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Financial Score + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <FinancialScoreCard score={data.financial_score} summary={data.summary} billStatus={data.bill_status} />
        </div>
        <div className="lg:col-span-3">
          <EvaluationSummaryCards summary={data.summary} monthComparison={data.month_comparison} billStatus={data.bill_status} />
        </div>
      </div>

      {/* Charts */}
      <FinancialCharts
        categoryBreakdown={data.spending_analysis.category_breakdown}
        trend={data.trend}
        summary={data.summary}
      />

      {/* Spending Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpendingInsightCard
          spendingAnalysis={data.spending_analysis}
          insights={data.insights}
        />
        <RecommendationCard recommendations={data.recommendations} />
      </div>
    </div>
  );
};

// ===== Skeleton Loading =====
const SkeletonBlock = ({ className = '' }) => (
  <div className={`bg-navy/5 border-3 border-navy/10 rounded-brutal animate-pulse ${className}`} />
);

const EvaluationSkeleton = () => (
  <div className="space-y-6">
    <div className="animate-slide-up">
      <SkeletonBlock className="h-8 w-64" />
      <SkeletonBlock className="h-4 w-96 mt-3" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <SkeletonBlock className="h-64 lg:col-span-1" />
      <SkeletonBlock className="h-64 lg:col-span-3" />
    </div>
    <SkeletonBlock className="h-80" />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SkeletonBlock className="h-96" />
      <SkeletonBlock className="h-96" />
    </div>
  </div>
);

// ===== Error State =====
const EvaluationError = ({ message, onRetry }) => (
  <div className="brutal-card text-center py-16 border-expense">
    <p className="text-5xl mb-4">⚠️</p>
    <p className="text-expense font-bold text-lg mb-2">Gagal Memuat Evaluasi</p>
    <p className="text-navy/40 text-sm mb-4">{message}</p>
    <button onClick={onRetry} className="btn-brutal text-sm">Coba Lagi</button>
  </div>
);

// ===== Empty State =====
const EvaluationEmpty = () => (
  <div className="brutal-card text-center py-16">
    <p className="text-5xl mb-4">📭</p>
    <p className="text-navy/40 font-bold text-lg mb-2">Belum Ada Data</p>
    <p className="text-navy/30 text-sm">Mulai tambahkan transaksi untuk melihat evaluasi keuanganmu.</p>
  </div>
);

export default MonthlyEvaluation;