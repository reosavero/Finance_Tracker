import { useState, useEffect, useRef, useMemo } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { formatNumberInput, parseNumberInput } from '../../utils/currencyInput';
import {
  HiOutlinePlus,
  HiOutlineMinus,
  HiOutlineLockClosed,
  HiOutlineChevronDown,
  HiOutlineCheck,
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

// =====================================================
// CategorySelect — Custom dropdown kategori dengan
// sudut lengkung (neubrutalism), opsi tidak kotak
// =====================================================
const CategorySelect = ({ value, onChange, categories, budgetMap, type, disabled }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selected = categories.find((c) => String(c.id) === String(value));

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled}
        className={`input-brutal w-full text-left flex items-center justify-between gap-2 text-sm ${
          value ? 'text-navy font-bold' : 'text-navy/30 font-medium'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className="truncate">
          {selected ? `${selected.icon} ${selected.name}` : 'Pilih Kategori'}
        </span>
        <HiOutlineChevronDown className={`w-4 h-4 shrink-0 text-navy/40 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 max-h-52 overflow-y-auto rounded-brutal border-3 border-navy bg-white shadow-brutal-lg animate-pop">
          {categories.length === 0 && (
            <div className="px-4 py-3 text-xs font-medium text-navy/40">Tidak ada kategori</div>
          )}
          {categories.map((c) => {
            const budget = type === 'expense' ? budgetMap?.get(String(c.id)) : null;
            const locked = Boolean(budget?.is_locked);
            const remaining = budget ? Math.max(Number(budget.remaining) || 0, 0) : null;
            const isSelected = String(c.id) === String(value);

            return (
              <button
                key={c.id}
                type="button"
                disabled={locked}
                onClick={() => {
                  if (!locked) {
                    onChange(String(c.id));
                    setOpen(false);
                  }
                }}
                className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors first:rounded-t-brutal last:rounded-b-brutal ${
                  locked
                    ? 'cursor-not-allowed text-navy/30 bg-cream/50'
                    : isSelected
                      ? 'bg-primary/10 font-bold text-navy'
                      : 'font-medium text-navy/70 hover:bg-cream'
                }`}
              >
                <span className="shrink-0">{c.icon}</span>
                <span className="flex-1 truncate">{c.name}</span>
                {locked && (
                  <span className="shrink-0 text-[10px] font-bold text-expense">🔒 Habis</span>
                )}
                {!locked && budget && (
                  <span className="shrink-0 text-[10px] font-bold text-navy/40">Sisa {formatRp(remaining)}</span>
                )}
                {isSelected && !locked && (
                  <HiOutlineCheck className="w-4 h-4 shrink-0 text-primary" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
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