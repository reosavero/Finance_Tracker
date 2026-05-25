import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import transactionService from '../services/transactionService';
import EditTransactionModal from '../components/Transactions/EditTransactionModal';
import toast from 'react-hot-toast';
import {
  HiOutlineFilter,
  HiOutlinePencilAlt,
  HiOutlineSearch,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
} from 'react-icons/hi';

const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  // Helper: tanggal awal & akhir bulan berjalan
  const getCurrentMonthRange = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
    return {
      start_date: `${y}-${m}-01`,
      end_date: `${y}-${m}-${String(lastDay).padStart(2, '0')}`,
    };
  };

  const [filters, setFilters] = useState(() => ({
    type: '',
    category_id: '',
    ...getCurrentMonthRange(),
  }));
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  // Riwayat bulanan
  const [monthlyHistory, setMonthlyHistory] = useState([]);
  const [expandedMonth, setExpandedMonth] = useState(null);
  const [monthTransactions, setMonthTransactions] = useState([]);
  const [loadingMonth, setLoadingMonth] = useState(null);

  // Scrollable table: awalnya 5 transaksi, bisa expand
  const [visibleCount, setVisibleCount] = useState(5);
  const INITIAL_VISIBLE = 5;
  const STEP_VISIBLE = 10;

  // Reset visibleCount when filters/search change
  useEffect(() => { setVisibleCount(INITIAL_VISIBLE); }, [filters, debouncedSearch]);

  const fetchTransactions = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 100 };
      if (filters.type) params.type = filters.type;
      if (filters.category_id) params.category_id = filters.category_id;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

      const res = await transactionService.getTransactions(params);
      setTransactions(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, totalPages: 1 });
    } catch (err) {
      const message = err.response?.data?.message || 'Gagal memuat transaksi';
      setError(message);
      setTransactions([]);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyHistory = useCallback(async () => {
    try {
      const res = await api.get('/dashboard/summary', { params: { _t: Date.now() } });
      setMonthlyHistory(res.data.data?.monthly_history || []);
    } catch {
      // Silent
    }
  }, []);

  useEffect(() => { api.get('/categories').then(r => setCategories(r.data.data)).catch(() => {}); }, []);
  useEffect(() => { fetchMonthlyHistory(); }, [fetchMonthlyHistory]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { fetchTransactions(1); }, [filters, debouncedSearch]);

  const handleDelete = async (id) => {
    if (!confirm('Hapus transaksi ini?')) return;
    try {
      await transactionService.deleteTransaction(id);
      toast.success('Transaksi dihapus! 🗑️');
      fetchTransactions(pagination.page);
      fetchMonthlyHistory();
    } catch (err) { toast.error('Gagal menghapus'); }
  };

  const handleEditSuccess = () => {
    fetchTransactions(pagination.page);
    fetchMonthlyHistory();
  };

  const resetFilters = () => setFilters({ type: '', category_id: '', ...getCurrentMonthRange() });

  // Hitung label bulan aktif dari filter
  const activeMonthLabel = (() => {
    if (filters.start_date && filters.end_date) {
      const d = new Date(filters.start_date + 'T00:00:00');
      return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    }
    return 'Semua Waktu';
  })();

  // Klik card bulanan → expand & fetch transaksi bulan itu
  const handleMonthClick = async (month) => {
    if (expandedMonth === month) {
      setExpandedMonth(null);
      return;
    }
    setExpandedMonth(month);
    setLoadingMonth(month);
    try {
      const [year, m] = month.split('-');
      const startDate = `${year}-${m}-01`;
      const lastDay = new Date(parseInt(year), parseInt(m), 0).getDate();
      const endDate = `${year}-${m}-${String(lastDay).padStart(2, '0')}`;
      const res = await api.get('/transactions', {
        params: { start_date: startDate, end_date: endDate, limit: 50 },
      });
      setMonthTransactions(res.data.data || []);
    } catch {
      setMonthTransactions([]);
    } finally {
      setLoadingMonth(null);
    }
  };

  const formatMonthLabel = (monthStr) => {
    const [year, m] = monthStr.split('-');
    return `${MONTH_NAMES[parseInt(m) - 1]} ${year}`;
  };

  // Filter by month from card
  const handleFilterByMonth = (month) => {
    const [year, m] = month.split('-');
    const lastDay = new Date(parseInt(year), parseInt(m), 0).getDate();
    setFilters((prev) => ({
      ...prev,
      type: prev.type,
      category_id: prev.category_id,
      start_date: `${year}-${m}-01`,
      end_date: `${year}-${m}-${String(lastDay).padStart(2, '0')}`,
    }));
    setExpandedMonth(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">🕐 Riwayat Transaksi</h1>
          <p className="text-navy/40 text-sm font-medium mt-1">Transaksi bulan {activeMonthLabel}</p>
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className="btn-brutal-ghost flex items-center gap-2 text-sm">
          <HiOutlineFilter className="w-4 h-4" /> Filter
        </button>
      </div>

      {/* Search */}
      <div className="brutal-card bg-white/90">
        <div className="relative">
          <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-navy/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau deskripsi transaksi..."
            className="w-full rounded-brutal border-3 border-navy bg-cream/50 py-3 pl-12 pr-12 text-sm font-semibold text-navy placeholder:text-navy/30 outline-none transition-all focus:bg-white focus:shadow-brutal-sm focus:-translate-y-0.5"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-navy/40 transition-all hover:bg-navy/10 hover:text-navy"
              aria-label="Hapus pencarian"
            >
              <HiOutlineX className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-bold text-navy/40">
            {debouncedSearch ? `Menampilkan hasil untuk "${debouncedSearch}"` : 'Ketik keyword untuk mencari transaksi secara realtime'}
          </p>
          {loading && <p className="text-xs font-bold text-primary animate-pulse">Mencari transaksi...</p>}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="brutal-card animate-slide-up">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} className="select-brutal text-sm">
              <option value="">Semua Tipe</option>
              <option value="expense">Pengeluaran</option>
              <option value="income">Pemasukan</option>
            </select>
            <select value={filters.category_id} onChange={(e) => setFilters({ ...filters, category_id: e.target.value })} className="select-brutal text-sm">
              <option value="">Semua Kategori</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
            <input type="date" value={filters.start_date} onChange={(e) => setFilters({ ...filters, start_date: e.target.value })} className="input-brutal text-sm" />
            <input type="date" value={filters.end_date} onChange={(e) => setFilters({ ...filters, end_date: e.target.value })} className="input-brutal text-sm" />
          </div>
          <button onClick={resetFilters} className="mt-3 text-xs text-primary font-bold underline decoration-2 hover:text-navy">Reset Filter</button>
        </div>
      )}

      {/* Transaction Table */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-navy border-t-primary rounded-full animate-spin" /></div>
      ) : error ? (
        <div className="brutal-card text-center py-12 border-expense">
          <p className="text-4xl mb-3">⚠️</p>
          <p className="text-expense font-bold">{error}</p>
          <button onClick={() => fetchTransactions(1)} className="btn-brutal-ghost mt-4 text-xs">Coba Lagi</button>
        </div>
      ) : transactions.length === 0 ? (
        <div className="brutal-card text-center py-12">
          <p className="text-4xl mb-3">{debouncedSearch ? '🔎' : '📭'}</p>
          <p className="text-navy/40 font-bold">
            {debouncedSearch ? `Tidak ada transaksi yang cocok dengan "${debouncedSearch}"` : 'Belum ada transaksi'}
          </p>
          {debouncedSearch && (
            <button onClick={() => setSearch('')} className="btn-brutal-ghost mt-4 text-xs">Tampilkan Semua</button>
          )}
        </div>
      ) : (
        <div className="brutal-card overflow-hidden p-0">
          {/* Header judul + jumlah */}
          <div className="flex items-center justify-between px-5 py-3 border-b-3 border-navy bg-cream">
            <p className="text-xs font-bold text-navy/50">
              Menampilkan {Math.min(visibleCount, transactions.length)} dari {transactions.length} transaksi
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-3 border-navy bg-cream sticky top-0 z-10">
                  <th className="text-left px-5 py-3 text-xs font-bold text-navy uppercase tracking-wider bg-cream">Tanggal</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-navy uppercase tracking-wider bg-cream">Kategori</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-navy uppercase tracking-wider hidden sm:table-cell bg-cream">Keterangan</th>
                  <th className="text-right px-5 py-3 text-xs font-bold text-navy uppercase tracking-wider bg-cream">Nominal</th>
                  <th className="px-5 py-3 w-28 text-center text-xs font-bold text-navy uppercase tracking-wider bg-cream">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, visibleCount).map((t) => (
                  <tr key={t.id} className="border-b-2 border-navy/10 hover:bg-cream/50 transition-colors">
                    <td className="px-5 py-4 text-sm font-medium text-navy/60">
                      {new Date(t.transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{t.category_icon}</span>
                        <span className="text-sm font-bold text-navy">{t.category_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-navy/40 hidden sm:table-cell truncate max-w-[200px]">{t.description || '-'}</td>
                    <td className="px-5 py-4 text-right">
                      <span className={`text-sm font-bold px-2 py-1 rounded-lg border-2 border-navy ${
                        t.type === 'income' ? 'bg-income text-navy' : 'bg-expense/10 text-expense'
                      }`}>
                        {t.type === 'income' ? '+' : '-'}{formatRp(t.amount)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingTransaction(t)}
                          className="p-2 rounded-brutal border-2 border-transparent text-navy/30 hover:-translate-y-0.5 hover:border-primary hover:text-primary hover:bg-primary/10 transition-all"
                          title="Edit transaksi"
                        >
                          <HiOutlinePencilAlt className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(t.id)}
                          className="p-2 rounded-brutal border-2 border-transparent text-navy/20 hover:-translate-y-0.5 hover:border-expense hover:text-expense hover:bg-expense/10 transition-all"
                          title="Hapus transaksi"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tombol tampilkan lebih banyak / kembali ke 5 */}
          {visibleCount > INITIAL_VISIBLE || transactions.length > visibleCount ? (
            <div className="flex items-center justify-center gap-3 py-3 border-t-2 border-navy/10 bg-cream/30">
              {transactions.length > visibleCount && (
                <button
                  onClick={() => setVisibleCount(prev => prev + STEP_VISIBLE)}
                  className="btn-brutal-ghost text-xs"
                >
                  ⬇ Tampilkan lebih banyak ({transactions.length - visibleCount} sisanya)
                </button>
              )}
              {visibleCount > INITIAL_VISIBLE && (
                <button
                  onClick={() => setVisibleCount(INITIAL_VISIBLE)}
                  className="text-xs font-bold text-expense hover:text-expense/80 transition-colors px-3 py-1.5 rounded-brutal border-2 border-expense/40 hover:border-expense hover:bg-expense/5"
                >
                  ⬆ Kembali ke 5 terakhir
                </button>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* ===== Card Riwayat Bulanan ===== */}
      {monthlyHistory.length > 0 && (
        <div className="brutal-card animate-slide-up">
          <h3 className="text-lg font-bold text-navy mb-3">📅 Riwayat Bulanan</h3>
          <div className="space-y-2">
            {monthlyHistory.map((m) => {
              const isExpanded = expandedMonth === m.month;
              const isLoading = loadingMonth === m.month;
              const net = Number(m.total_income) - Number(m.total_expense);

              return (
                <div key={m.month} className="border-2 border-navy/10 rounded-brutal overflow-hidden transition-all hover:border-navy/30">
                  {/* Header card — klik untuk expand */}
                  <button
                    onClick={() => handleMonthClick(m.month)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-cream/30 hover:bg-cream/60 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-brutal border-2 border-navy flex items-center justify-center shrink-0 ${
                        net >= 0 ? 'bg-income/20' : 'bg-expense/20'
                      }`}>
                        <span className="text-lg">{net >= 0 ? '📈' : '📉'}</span>
                      </div>
                      <div className="min-w-0 text-left">
                        <p className="text-sm font-bold text-navy">{formatMonthLabel(m.month)}</p>
                        <p className="text-[11px] font-medium text-navy/50">
                          {m.transaction_count} transaksi
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`text-sm font-bold ${net >= 0 ? 'text-income' : 'text-expense'}`}>
                          {net >= 0 ? '+' : ''}{formatRp(net)}
                        </p>
                        <p className="text-[10px] font-medium text-navy/40">
                          Masuk {formatRp(m.total_income)} • Keluar {formatRp(m.total_expense)}
                        </p>
                      </div>
                      {isExpanded ? (
                        <HiOutlineChevronUp className="w-5 h-5 text-navy/40 shrink-0" />
                      ) : (
                        <HiOutlineChevronDown className="w-5 h-5 text-navy/40 shrink-0" />
                      )}
                    </div>
                  </button>

                  {/* Expanded — daftar transaksi bulan itu */}
                  {isExpanded && (
                    <div className="border-t-2 border-navy/10 px-3 py-2 bg-white">
                      {isLoading ? (
                        <div className="flex justify-center py-6">
                          <div className="w-6 h-6 border-2 border-navy border-t-primary rounded-full animate-spin" />
                        </div>
                      ) : monthTransactions.length > 0 ? (
                        <>
                          <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                            {monthTransactions.map((t) => (
                              <div key={t.id}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-brutal border-2 border-transparent hover:border-navy hover:bg-cream transition-all"
                              >
                                <div className="w-9 h-9 rounded-brutal border-2 border-navy flex items-center justify-center text-base shrink-0"
                                  style={{ backgroundColor: `${t.category_color}30` }}>
                                  {t.category_icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-navy truncate">
                                    {t.description || t.category_name}
                                  </p>
                                  <p className="text-[11px] font-medium text-navy/40">
                                    {t.category_name} • {new Date(t.transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                  </p>
                                </div>
                                <span className={`text-xs font-bold px-2 py-1 rounded-brutal border-2 border-navy shrink-0 ${
                                  t.type === 'income' ? 'bg-income text-navy' : 'bg-expense/10 text-expense'
                                }`}>
                                  {t.type === 'income' ? '+' : '-'}{formatRp(t.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="text-center text-navy/30 font-medium py-4 text-sm">Tidak ada transaksi</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <EditTransactionModal
        isOpen={Boolean(editingTransaction)}
        transaction={editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};

export default Transactions;