import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineMinus } from 'react-icons/hi';

const QuickInput = ({ onSuccess }) => {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await api.get(`/categories?type=${type}`);
        setCategories(res.data.data);
        setCategoryId('');
      } catch (err) { /* silent */ }
    };
    fetchCats();
  }, [type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !categoryId) return toast.error('Nominal dan kategori wajib diisi');
    setLoading(true);
    try {
      await api.post('/transactions', {
        type, amount: parseFloat(amount), category_id: parseInt(categoryId),
        description: description || null, transaction_date: date,
      });
      toast.success(type === 'expense' ? 'Pengeluaran dicatat! 📝' : 'Pemasukan dicatat! 💸');
      setAmount(''); setDescription(''); setCategoryId('');
      setDate(new Date().toISOString().slice(0, 10));
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally { setLoading(false); }
  };

  return (
    <div className="brutal-card animate-slide-up">
      <h3 className="text-lg font-bold text-navy mb-4">⚡ Input Cepat</h3>

      {/* Type Toggle */}
      <div className="flex border-3 border-navy rounded-brutal overflow-hidden mb-4">
        <button onClick={() => setType('expense')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold transition-all ${
            type === 'expense' ? 'bg-expense text-white' : 'bg-white text-navy/40 hover:bg-cream'
          }`}>
          <HiOutlineMinus className="w-4 h-4" /> Keluar
        </button>
        <button onClick={() => setType('income')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold border-l-3 border-navy transition-all ${
            type === 'income' ? 'bg-income text-navy' : 'bg-white text-navy/40 hover:bg-cream'
          }`}>
          <HiOutlinePlus className="w-4 h-4" /> Masuk
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
          className="input-brutal text-xl font-bold" placeholder="Rp 0" min="1" required />
        <div className="grid grid-cols-2 gap-3">
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
            className="select-brutal text-sm" required>
            <option value="">Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-brutal text-sm" />
        </div>
        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
          className="input-brutal text-sm" placeholder="Keterangan (opsional)" />
        <button type="submit" disabled={loading}
          className={`w-full font-bold py-3 border-3 border-navy rounded-brutal shadow-brutal text-sm transition-all duration-150
            hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm
            active:translate-x-[4px] active:translate-y-[4px] active:shadow-brutal-none
            disabled:opacity-50 ${
            type === 'expense' ? 'bg-expense text-white' : 'bg-income text-navy'
          }`}>
          {loading ? '⏳ Menyimpan...' : type === 'expense' ? '📝 Catat Pengeluaran' : '💸 Catat Pemasukan'}
        </button>
      </form>
    </div>
  );
};

export default QuickInput;
