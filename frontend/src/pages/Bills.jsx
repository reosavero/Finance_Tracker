import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineCheck } from 'react-icons/hi';

const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const statusConfig = {
  overdue: { label: '🔴 Terlambat', cls: 'bg-expense text-white border-navy' },
  due_soon: { label: '🟡 Segera', cls: 'bg-warning text-navy border-navy' },
  upcoming: { label: '⏳ Mendatang', cls: 'bg-cream text-navy/50 border-navy' },
  paid: { label: '✅ Lunas', cls: 'bg-income text-navy border-navy' },
};

const Bills = () => {
  const [bills, setBills] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', amount: '', due_day: '', category_id: '' });

  const fetchBills = async () => {
    try { const res = await api.get('/bills'); setBills(res.data.data); }
    catch (err) { toast.error('Gagal memuat tagihan'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchBills();
    api.get('/categories?type=expense').then(r => setCategories(r.data.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/bills', {
        name: form.name, amount: parseFloat(form.amount),
        due_day: parseInt(form.due_day), category_id: form.category_id ? parseInt(form.category_id) : null,
      });
      toast.success('Tagihan ditambahkan! 🔔');
      setForm({ name: '', amount: '', due_day: '', category_id: '' }); setShowForm(false); fetchBills();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menyimpan'); }
  };

  const handleMarkPaid = async (id) => {
    try { await api.put(`/bills/${id}/pay`); toast.success('Ditandai lunas! ✅'); fetchBills(); }
    catch (err) { toast.error('Gagal update'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus tagihan ini?')) return;
    try { await api.delete(`/bills/${id}`); toast.success('Tagihan dihapus'); fetchBills(); }
    catch (err) { toast.error('Gagal menghapus'); }
  };

  const totalBills = bills.reduce((s, b) => s + parseFloat(b.amount), 0);
  const unpaid = bills.filter(b => b.due_status !== 'paid');

  return (
    <div className="space-y-6">
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

      {showForm && (
        <div className="brutal-card animate-slide-up">
          <h3 className="text-sm font-bold text-navy/60 mb-4">📝 Tagihan Baru</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-brutal" placeholder="Nama (cth: Sewa Kos)" required />
            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="input-brutal" placeholder="Nominal (Rp)" min="1" required />
            <input type="number" value={form.due_day} onChange={(e) => setForm({ ...form, due_day: e.target.value })}
              className="input-brutal" placeholder="Tgl jatuh tempo (1-31)" min="1" max="31" required />
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="select-brutal">
              <option value="">Kategori (opsional)</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
            <div className="sm:col-span-2">
              <button type="submit" className="btn-brutal-secondary w-full sm:w-auto">💾 Simpan Tagihan</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-navy border-t-primary rounded-full animate-spin" /></div>
      ) : bills.length === 0 ? (
        <div className="brutal-card text-center py-12">
          <p className="text-4xl mb-3">🔔</p>
          <p className="text-navy/50 font-bold mb-1">Belum ada tagihan</p>
          <p className="text-navy/30 text-sm font-medium">Tambahkan tagihan rutin seperti kos, listrik, atau langganan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bills.map((bill, i) => {
            const st = statusConfig[bill.due_status] || statusConfig.upcoming;
            return (
              <div key={bill.id} className="brutal-card-hover animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-brutal border-3 border-navy bg-warning/20 flex items-center justify-center">
                      <span className="text-navy font-bold text-lg">{bill.due_day}</span>
                    </div>
                    <div>
                      <p className="font-bold text-navy text-lg">{bill.name}</p>
                      <p className="text-xs font-medium text-navy/40">Setiap tanggal {bill.due_day}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full border-2 font-bold ${st.cls}`}>{st.label}</span>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t-2 border-navy/10">
                  <span className="text-xl font-bold text-navy">{formatRp(bill.amount)}</span>
                  <div className="flex gap-2">
                    {bill.due_status !== 'paid' && (
                      <button onClick={() => handleMarkPaid(bill.id)}
                        className="flex items-center gap-1 px-3 py-2 rounded-brutal border-2 border-navy text-xs font-bold bg-income text-navy hover:shadow-brutal-sm transition-all">
                        <HiOutlineCheck className="w-3.5 h-3.5" /> Bayar
                      </button>
                    )}
                    <button onClick={() => handleDelete(bill.id)}
                      className="p-2 rounded-brutal border-2 border-transparent text-navy/20 hover:border-expense hover:text-expense hover:bg-expense/10 transition-all">
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Bills;
