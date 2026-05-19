import { useState, useEffect } from 'react';
import api from '../services/api';
import budgetService from '../services/budgetService';
import EditBudgetModal from '../components/Budget/EditBudgetModal';
import toast from 'react-hot-toast';
import { HiOutlinePencilAlt, HiOutlineTrash } from 'react-icons/hi';

const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const Budget = () => {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category_id: '', limit_amount: '' });
  const [editingBudget, setEditingBudget] = useState(null);
  const [submittingCreate, setSubmittingCreate] = useState(false);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const res = await budgetService.getBudgets();
      setBudgets(res.data.data || []);
    } catch (err) {
      toast.error('Gagal memuat budget');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
    api.get('/categories?type=expense').then(r => setCategories(r.data.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.category_id || !form.limit_amount || Number(form.limit_amount) <= 0) {
      return toast.error('Kategori dan nominal budget wajib diisi dengan benar');
    }

    setSubmittingCreate(true);
    try {
      await budgetService.createBudget({
        category_id: parseInt(form.category_id),
        limit_amount: parseFloat(form.limit_amount),
      });
      toast.success('Budget disimpan! 📊');
      setForm({ category_id: '', limit_amount: '' });
      setShowForm(false);
      fetchBudgets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus budget ini?')) return;
    try {
      await budgetService.deleteBudget(id);
      toast.success('Budget dihapus');
      fetchBudgets();
    } catch (err) {
      toast.error('Gagal menghapus');
    }
  };

  const handleEditSuccess = () => {
    fetchBudgets();
  };

  const getBarColor = (status) => {
    if (status === 'exceeded') return 'bg-expense';
    if (status === 'warning') return 'bg-warning';
    if (status === 'caution') return 'bg-secondary';
    return 'bg-income';
  };

  const getStatusBadge = (status) => {
    const map = {
      exceeded: 'bg-expense text-white',
      warning: 'bg-warning text-navy',
      caution: 'bg-secondary text-navy',
      safe: 'bg-income text-navy',
    };
    return map[status] || map.safe;
  };

  const getStatusLabel = (budget) => {
    if (budget.is_locked) return 'Terkunci';
    if (budget.status === 'warning') return 'Hampir Habis';
    if (budget.status === 'caution') return 'Waspada';
    return 'Aman';
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
              className="select-brutal flex-1" required disabled={submittingCreate}>
              <option value="">Pilih Kategori</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
            <input type="number" value={form.limit_amount} onChange={(e) => setForm({ ...form, limit_amount: e.target.value })}
              className="input-brutal flex-1" placeholder="Batas (Rp)" min="1" required disabled={submittingCreate} />
            <button type="submit" disabled={submittingCreate} className="btn-brutal-secondary whitespace-nowrap disabled:opacity-50">
              {submittingCreate ? '⏳ Menyimpan...' : '💾 Simpan'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="brutal-card animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-brutal border-3 border-navy bg-cream" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/2 rounded bg-cream" />
                  <div className="h-3 w-1/3 rounded bg-cream" />
                </div>
              </div>
              <div className="h-4 rounded-full border-3 border-navy bg-cream" />
            </div>
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="brutal-card text-center py-12">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-navy/50 font-bold mb-1">Belum ada budget</p>
          <p className="text-navy/30 text-sm font-medium">Atur batas pengeluaran agar keuanganmu terkontrol</p>
          <button onClick={() => setShowForm(true)} className="btn-brutal mt-5 text-sm">Buat Budget Pertama</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b, i) => (
            <div key={b.id} className="brutal-card-hover animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-brutal border-3 border-navy flex items-center justify-center text-xl shrink-0"
                    style={{ backgroundColor: `${b.category_color}25` }}>
                    {b.category_icon}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-navy truncate">{b.category_name}</p>
                    <p className="text-xs font-medium text-navy/40">Limit: {formatRp(b.limit_amount)}</p>
                    <p className="text-[11px] font-bold text-navy/30">Periode: {String(b.budget_month).slice(0, 7)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-3 py-1 rounded-full border-2 border-navy font-bold ${getStatusBadge(b.status)}`}>
                    {b.is_locked ? `🔒 ${getStatusLabel(b)}` : `${b.percentage}%`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingBudget(b)}
                    className="p-2 rounded-brutal border-2 border-transparent text-navy/30 hover:-translate-y-0.5 hover:border-primary hover:text-primary hover:bg-primary/10 transition-all"
                    title="Edit budget"
                    aria-label="Edit budget"
                  >
                    <HiOutlinePencilAlt className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(b.id)}
                    className="p-2 rounded-brutal border-2 border-transparent text-navy/20 hover:-translate-y-0.5 hover:border-expense hover:text-expense hover:bg-expense/10 transition-all"
                    title="Hapus budget"
                    aria-label="Hapus budget"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="h-4 bg-cream border-3 border-navy rounded-full overflow-hidden mb-2">
                <div className={`h-full rounded-full transition-all duration-700 ${getBarColor(b.status)}`}
                  style={{ width: `${Math.min(b.percentage, 100)}%` }} />
              </div>

              <div className="flex justify-between text-xs font-bold gap-3">
                <span className="text-navy/40">Terpakai: {formatRp(b.spent_amount)}</span>
                <span className={b.remaining >= 0 ? 'text-income' : 'text-expense'}>
                  Sisa: {formatRp(Math.max(b.remaining, 0))}
                </span>
              </div>

              {b.is_locked && (
                <div className="mt-3 rounded-brutal border-2 border-expense bg-expense/10 px-3 py-2 text-xs font-bold text-expense">
                  Input pengeluaran untuk kategori ini otomatis diblokir sampai periode budget berikutnya.
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <EditBudgetModal
        isOpen={Boolean(editingBudget)}
        budget={editingBudget}
        onClose={() => setEditingBudget(null)}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};

export default Budget;
