import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const Budget = () => {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category_id: '', limit_amount: '' });

  const fetchBudgets = async () => {
    try { const res = await api.get('/budgets'); setBudgets(res.data.data); }
    catch (err) { toast.error('Gagal memuat budget'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchBudgets();
    api.get('/categories?type=expense').then(r => setCategories(r.data.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/budgets', { category_id: parseInt(form.category_id), limit_amount: parseFloat(form.limit_amount) });
      toast.success('Budget disimpan! 📊');
      setForm({ category_id: '', limit_amount: '' }); setShowForm(false); fetchBudgets();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menyimpan'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus budget ini?')) return;
    try { await api.delete(`/budgets/${id}`); toast.success('Budget dihapus'); fetchBudgets(); }
    catch (err) { toast.error('Gagal menghapus'); }
  };

  const getBarColor = (status) => {
    if (status === 'exceeded') return 'bg-expense';
    if (status === 'warning') return 'bg-warning';
    if (status === 'caution') return 'bg-secondary';
    return 'bg-income';
  };

  const getStatusBadge = (status, pct) => {
    const map = {
      exceeded: 'bg-expense text-white',
      warning: 'bg-warning text-navy',
      caution: 'bg-secondary text-navy',
      safe: 'bg-income text-navy',
    };
    return map[status] || map.safe;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">📊 Anggaran Bulanan</h1>
          <p className="text-navy/40 text-sm font-medium mt-1">Atur batas pengeluaran per kategori</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-brutal text-sm">
          ➕ Tambah Budget
        </button>
      </div>

      {showForm && (
        <div className="brutal-card animate-slide-up">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="select-brutal flex-1" required>
              <option value="">Pilih Kategori</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
            <input type="number" value={form.limit_amount} onChange={(e) => setForm({ ...form, limit_amount: e.target.value })}
              className="input-brutal flex-1" placeholder="Batas (Rp)" min="1" required />
            <button type="submit" className="btn-brutal-secondary whitespace-nowrap">💾 Simpan</button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-navy border-t-primary rounded-full animate-spin" /></div>
      ) : budgets.length === 0 ? (
        <div className="brutal-card text-center py-12">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-navy/50 font-bold mb-1">Belum ada budget</p>
          <p className="text-navy/30 text-sm font-medium">Atur batas pengeluaran agar keuanganmu terkontrol</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b, i) => (
            <div key={b.id} className="brutal-card-hover animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-brutal border-3 border-navy flex items-center justify-center text-xl"
                    style={{ backgroundColor: `${b.category_color}25` }}>
                    {b.category_icon}
                  </div>
                  <div>
                    <p className="font-bold text-navy">{b.category_name}</p>
                    <p className="text-xs font-medium text-navy/40">Limit: {formatRp(b.limit_amount)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-3 py-1 rounded-full border-2 border-navy font-bold ${getStatusBadge(b.status, b.percentage)}`}>
                    {b.percentage}%
                  </span>
                  <button onClick={() => handleDelete(b.id)} className="text-navy/20 hover:text-expense font-bold transition-colors">✕</button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-4 bg-cream border-3 border-navy rounded-full overflow-hidden mb-2">
                <div className={`h-full rounded-full transition-all duration-700 ${getBarColor(b.status)}`}
                  style={{ width: `${Math.min(b.percentage, 100)}%` }} />
              </div>

              <div className="flex justify-between text-xs font-bold">
                <span className="text-navy/40">Terpakai: {formatRp(b.spent_amount)}</span>
                <span className={b.remaining >= 0 ? 'text-income' : 'text-expense'}>
                  Sisa: {formatRp(Math.max(b.remaining, 0))}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Budget;
