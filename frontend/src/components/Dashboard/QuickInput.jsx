import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { formatNumberInput, parseNumberInput } from '../../utils/currencyInput';
import CategorySelect from '../ui/CategorySelect';
import {
  HiOutlinePlus,
  HiOutlineMinus,
  HiOutlineLockClosed,
} from 'react-icons/hi';

const formatRp = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
}).format(Math.round(Number(value) || 0));

const getBudgetMonth = (dateString) => {
  if (!dateString) return '';
  return String(dateString).slice(0, 7);
};

// Helper: local date (WIB-safe, bukan UTC)
const toLocalDate = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const QuickInput = ({ onSuccess }) => {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(toLocalDate());
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
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

  useEffect(() => {
    const fetchBudgets = async () => {
      if (type !== 'expense') {
        setBudgets([]);
        return;
      }
      try {
        const month = getBudgetMonth(date);
        const res = await api.get('/budgets', { params: month ? { month } : {} });
        setBudgets(res.data.data || []);
      } catch (err) {
        setBudgets([]);
      }
    };
    fetchBudgets();
  }, [type, date]);

  const budgetMap = useMemo(() => {
    const map = new Map();
    budgets.forEach((budget) => {
      map.set(String(budget.category_id), budget);
    });
    return map;
  }, [budgets]);

  const selectedBudget = type === 'expense' ? budgetMap.get(String(categoryId)) : null;
  const isBudgetLocked = Boolean(selectedBudget?.is_locked);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseNumberInput(amount) <= 0) return toast.error('Nominal dan kategori wajib diisi');
    if (!categoryId) return toast.error('Kategori wajib dipilih');
    if (type === 'expense' && isBudgetLocked) {
      return toast.error('Kategori ini sudah melewati limit anggaran bulan ini, input pengeluaran ditolak.');
    }
    setLoading(true);
    try {
      await api.post('/transactions', {
        type, amount: parseNumberInput(amount), category_id: parseInt(categoryId),
        description: description || null, transaction_date: date,
      });
      toast.success(type === 'expense' ? 'Pengeluaran dicatat! 📝' : 'Pemasukan dicatat! 💸');
      await onSuccess?.();
      setAmount(''); setDescription(''); setCategoryId('');
      setDate(toLocalDate());
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
        <input type="text" inputMode="numeric" value={amount} onChange={(e) => setAmount(formatNumberInput(e.target.value))}
          className={`input-brutal text-xl font-bold ${
            amount && type === 'income' ? 'border-income focus:shadow-brutal-income' :
            amount && type === 'expense' ? 'border-expense focus:shadow-brutal-expense' : ''
          }`}
          placeholder="Rp 0" required />

        <div className="grid grid-cols-2 gap-3">
          <CategorySelect
            value={categoryId}
            onChange={setCategoryId}
            categories={categories}
            budgetMap={budgetMap}
            type={type}
            disabled={loading}
          />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-brutal text-sm" />
        </div>

        {type === 'expense' && selectedBudget && (
          <div className={`rounded-brutal border-3 border-navy p-3 ${isBudgetLocked ? 'bg-expense/10' : 'bg-cream/70'}`}>
            <div className="flex items-start gap-3">
              {isBudgetLocked && (
                <div className="mt-0.5 shrink-0">
                  <HiOutlineLockClosed className="w-5 h-5 text-expense" />
                </div>
              )}
              <div className="text-xs font-bold leading-relaxed text-navy/70">
                <p className={`${isBudgetLocked ? 'text-expense' : 'text-navy'} font-extrabold`}>
                  {isBudgetLocked ? 'Limit anggaran kategori ini sudah habis.' : 'Budget kategori aktif.'}
                </p>
                <p className="mt-1">
                  Terpakai {formatRp(selectedBudget.spent_amount)} dari {formatRp(selectedBudget.limit_amount)} • Sisa {formatRp(Math.max(selectedBudget.remaining, 0))}
                </p>
              </div>
            </div>
          </div>
        )}

        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
          className="input-brutal text-sm" placeholder="Keterangan (opsional)" />
        <button type="submit" disabled={loading || (type === 'expense' && isBudgetLocked)}
          className={`w-full font-bold py-3 border-3 border-navy rounded-brutal shadow-brutal text-sm transition-all duration-150
            hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm
            active:translate-x-[4px] active:translate-y-[4px] active:shadow-brutal-none
            disabled:opacity-50 ${
            type === 'expense' ? 'bg-expense text-white' : 'bg-income text-navy'
          }`}>
          {loading ? '⏳ Menyimpan...' : type === 'expense' ? (isBudgetLocked ? '🔒 Limit Anggaran Habis' : '📝 Catat Pengeluaran') : '💸 Catat Pemasukan'}
        </button>
      </form>
    </div>
  );
};

export default QuickInput;