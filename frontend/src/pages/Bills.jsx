import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import billService from '../services/billService';
import EditBillModal from '../components/Bills/EditBillModal';
import PayBillModal from '../components/Bills/PayBillModal';
import toast from 'react-hot-toast';
import { formatNumberInput, parseNumberInput } from '../utils/currencyInput';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineCheck,
  HiOutlinePencilAlt,
} from 'react-icons/hi';
import {
  HiOutlineBanknotes,
} from 'react-icons/hi2';

const formatRp = (n) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(Number(n) || 0));

const statusConfig = {
  overdue: { label: '🔴 Terlambat', cls: 'bg-expense text-white border-navy' },
  due_soon: { label: '🟡 Segera', cls: 'bg-warning text-navy border-navy' },
  upcoming: { label: '⏳ Mendatang', cls: 'bg-cream text-navy/50 border-navy' },
  paid: { label: '✅ Lunas', cls: 'bg-income text-navy border-navy' },
};

// =====================================================
// Bills — Halaman manajemen tagihan rutin
// =====================================================
const Bills = () => {
  const [bills, setBills] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', amount: '', due_day: '', category_id: '' });
  const [editingBill, setEditingBill] = useState(null);
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [payingBill, setPayingBill] = useState(null);

  const fetchBills = useCallback(async () => {
    try {
      const res = await billService.getBills();
      setBills(res.data.data || []);
    } catch {
      toast.error('Gagal memuat tagihan');
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const r = await api.get('/categories?type=expense');
      setCategories(r.data.data);
    } catch {
      // Silent
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchBills(), fetchCategories()]).finally(() => setLoading(false));
  }, [fetchBills, fetchCategories]);

  const handlePaySuccess = useCallback(() => {
    fetchBills();
  }, [fetchBills]);

  const handleDelete = async (id) => {
    if (!confirm('Hapus tagihan ini?')) return;
    try {
      await billService.deleteBill(id);
      toast.success('Tagihan dihapus');
      fetchBills();
    } catch {
      toast.error('Gagal menghapus');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.amount || parseNumberInput(form.amount) <= 0) {
      return toast.error('Nama dan nominal tagihan wajib diisi dengan benar');
    }
    const dueDay = Number(form.due_day);
    if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
      return toast.error('Tanggal jatuh tempo harus 1 sampai 31');
    }
    setSubmittingCreate(true);
    try {
      await billService.createBill({
        name: form.name.trim(),
        amount: parseNumberInput(form.amount),
        due_day: parseInt(form.due_day),
        category_id: form.category_id ? parseInt(form.category_id) : null,
      });
      toast.success('Tagihan ditambahkan! 🔔');
      setForm({ name: '', amount: '', due_day: '', category_id: '' });
      setShowForm(false);
      fetchBills();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleEditSuccess = () => {
    fetchBills();
  };

  const totalBills = bills.reduce((s, b) => s + parseFloat(b.amount), 0);
  const unpaid = bills.filter((b) => b.due_status !== 'paid');

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">🔔 Tagihan Rutin</h1>
          <p className="text-navy/40 text-sm font-medium mt-1">
            {unpaid.length} belum dibayar • Total: {formatRp(totalBills)}/bulan
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-brutal text-sm">
          <HiOutlinePlus className="w-4 h-4 inline mr-1" /> Tambah Tagihan
        </button>
      </div>

      {/* FORM TAMBAH */}
      {showForm && (
        <div className="brutal-card animate-slide-up">
          <h3 className="text-sm font-bold text-navy/60 mb-4">📝 Tagihan Baru</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-brutal"
              placeholder="Nama (cth: Sewa Kos)"
              required
              disabled={submittingCreate}
            />
            <input
              type="text"
              inputMode="numeric"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: formatNumberInput(e.target.value) })}
              className="input-brutal"
              placeholder="Nominal (Rp)"
              required
              disabled={submittingCreate}
            />
            <input
              type="number"
              value={form.due_day}
              onChange={(e) => setForm({ ...form, due_day: e.target.value })}
              className="input-brutal"
              placeholder="Tgl jatuh tempo (1-31)"
              min="1"
              max="31"
              required
              disabled={submittingCreate}
            />
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="select-brutal"
              disabled={submittingCreate}
            >
              <option value="">Kategori (opsional)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={submittingCreate}
                className="btn-brutal-secondary w-full sm:w-auto disabled:opacity-50"
              >
                {submittingCreate ? '⏳ Menyimpan...' : '💾 Simpan Tagihan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LOADING */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="brutal-card animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-brutal border-3 border-navy bg-cream" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/2 rounded bg-cream" />
                  <div className="h-3 w-1/3 rounded bg-cream" />
                </div>
              </div>
              <div className="h-12 rounded-brutal bg-cream" />
            </div>
          ))}
        </div>
      ) : bills.length === 0 ? (
        <div className="brutal-card text-center py-12">
          <p className="text-4xl mb-3">🔔</p>
          <p className="text-navy/50 font-bold mb-1">Belum ada tagihan</p>
          <p className="text-navy/30 text-sm font-medium">
            Tambahkan tagihan rutin seperti kos, listrik, atau langganan
          </p>
          <button onClick={() => setShowForm(true)} className="btn-brutal mt-5 text-sm">
            Tambah Tagihan Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bills.map((bill, i) => {
            const st = statusConfig[bill.due_status] || statusConfig.upcoming;
            const isPaid = bill.due_status === 'paid';
            return (
              <div
                key={bill.id}
                className={`brutal-card-hover animate-slide-up ${isPaid ? 'opacity-70' : ''}`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-start justify-between mb-3 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-14 h-14 rounded-brutal border-3 border-navy flex items-center justify-center shrink-0 ${
                        isPaid ? 'bg-income/20' : 'bg-warning/20'
                      }`}
                    >
                      <span className="text-navy font-bold text-lg">{bill.due_day}</span>
                    </div>
                    <div className="min-w-0">
                      <p className={`font-bold text-navy text-lg truncate ${isPaid ? 'line-through' : ''}`}>
                        {bill.name}
                      </p>
                      <p className="text-xs font-medium text-navy/40">Setiap tanggal {bill.due_day}</p>
                      {bill.category_name && (
                        <p className="text-xs font-bold text-navy/30 mt-1">
                          {bill.category_icon} {bill.category_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full border-2 font-bold shrink-0 ${st.cls}`}>
                    {st.label}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t-2 border-navy/10 gap-3">
                  <span className={`text-xl font-bold ${isPaid ? 'text-navy/40 line-through' : 'text-navy'}`}>
                    {formatRp(bill.amount)}
                  </span>
                  <div className="flex gap-2 flex-wrap justify-end">
                    {!isPaid && (
                      <button
                        onClick={() => setPayingBill(bill)}
                        className="flex items-center gap-1 px-3 py-2 rounded-brutal border-2 border-navy text-xs font-bold bg-income text-navy hover:-translate-y-0.5 hover:shadow-brutal-sm transition-all"
                      >
                        <HiOutlineBanknotes className="w-3.5 h-3.5" /> Bayar
                      </button>
                    )}
                    {isPaid && (
                      <span className="flex items-center gap-1 px-3 py-2 rounded-brutal border-2 border-income text-xs font-bold text-income">
                        <HiOutlineCheck className="w-3.5 h-3.5" /> Lunas
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setEditingBill(bill)}
                      className="p-2 rounded-brutal border-2 border-transparent text-navy/30 hover:-translate-y-0.5 hover:border-primary hover:text-primary hover:bg-primary/10 transition-all"
                      title="Edit tagihan"
                    >
                      <HiOutlinePencilAlt className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(bill.id)}
                      className="p-2 rounded-brutal border-2 border-transparent text-navy/20 hover:-translate-y-0.5 hover:border-expense hover:text-expense hover:bg-expense/10 transition-all"
                      title="Hapus tagihan"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODALS */}
      <PayBillModal
        isOpen={Boolean(payingBill)}
        bill={payingBill}
        onClose={() => setPayingBill(null)}
        onSuccess={handlePaySuccess}
      />

      <EditBillModal
        isOpen={Boolean(editingBill)}
        bill={editingBill}
        categories={categories}
        onClose={() => setEditingBill(null)}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};

export default Bills;