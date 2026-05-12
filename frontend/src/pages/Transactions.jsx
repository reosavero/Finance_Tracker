import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineFilter, HiOutlineTrash } from 'react-icons/hi';

const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [filters, setFilters] = useState({ type: '', category_id: '', start_date: '', end_date: '' });
  const [showFilters, setShowFilters] = useState(false);

  const fetchTransactions = async (page = 1) => {
    try {
      const params = { page, limit: 15 };
      if (filters.type) params.type = filters.type;
      if (filters.category_id) params.category_id = filters.category_id;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      const res = await api.get('/transactions', { params });
      setTransactions(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) { toast.error('Gagal memuat transaksi'); }
    finally { setLoading(false); }
  };

  useEffect(() => { api.get('/categories').then(r => setCategories(r.data.data)).catch(() => {}); }, []);
  useEffect(() => { fetchTransactions(); }, [filters]);

  const handleDelete = async (id) => {
    if (!confirm('Hapus transaksi ini?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      toast.success('Transaksi dihapus! 🗑️');
      fetchTransactions(pagination.page);
    } catch (err) { toast.error('Gagal menghapus'); }
  };

  const resetFilters = () => setFilters({ type: '', category_id: '', start_date: '', end_date: '' });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">🕐 Riwayat Transaksi</h1>
          <p className="text-navy/40 text-sm font-medium mt-1">Semua catatan keuanganmu</p>
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className="btn-brutal-ghost flex items-center gap-2 text-sm">
          <HiOutlineFilter className="w-4 h-4" /> Filter
        </button>
      </div>

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

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-navy border-t-primary rounded-full animate-spin" /></div>
      ) : transactions.length === 0 ? (
        <div className="brutal-card text-center py-12">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-navy/40 font-bold">Belum ada transaksi</p>
        </div>
      ) : (
        <div className="brutal-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-3 border-navy bg-cream">
                  <th className="text-left px-5 py-4 text-xs font-bold text-navy uppercase tracking-wider">Tanggal</th>
                  <th className="text-left px-5 py-4 text-xs font-bold text-navy uppercase tracking-wider">Kategori</th>
                  <th className="text-left px-5 py-4 text-xs font-bold text-navy uppercase tracking-wider hidden sm:table-cell">Keterangan</th>
                  <th className="text-right px-5 py-4 text-xs font-bold text-navy uppercase tracking-wider">Nominal</th>
                  <th className="px-5 py-4 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
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
                      <button onClick={() => handleDelete(t.id)}
                        className="p-2 rounded-brutal border-2 border-transparent text-navy/20 hover:border-expense hover:text-expense hover:bg-expense/10 transition-all">
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t-3 border-navy bg-cream">
              <p className="text-xs font-bold text-navy/40">Halaman {pagination.page} / {pagination.totalPages}</p>
              <div className="flex gap-2">
                <button disabled={pagination.page <= 1} onClick={() => fetchTransactions(pagination.page - 1)}
                  className="btn-brutal-ghost text-xs disabled:opacity-30">← Prev</button>
                <button disabled={pagination.page >= pagination.totalPages} onClick={() => fetchTransactions(pagination.page + 1)}
                  className="btn-brutal-ghost text-xs disabled:opacity-30">Next →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Transactions;
