import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { formatNumberInput, parseNumberInput } from '../../utils/currencyInput';
import { HiOutlinePencilAlt, HiOutlineX } from 'react-icons/hi';
import budgetService from '../../services/budgetService';

const formatRp = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
}).format(Number(value) || 0);

const toMonthInputValue = (value) => {
  if (!value) return new Date().toISOString().slice(0, 7);
  return String(value).slice(0, 7);
};

const EditBudgetModal = ({ isOpen, budget, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    limit_amount: '',
    budget_month: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Kunci scroll body saat modal terbuka
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !budget) return;

    setForm({
      limit_amount: budget.limit_amount ? formatNumberInput(String(Number(budget.limit_amount))) : '',
      budget_month: toMonthInputValue(budget.budget_month),
      description: budget.description || '',
    });
    setError('');
  }, [isOpen, budget]);

  if (!isOpen || !budget) return null;

  const handleChange = (field, value) => {
    const formatted = (field === 'limit_amount') ? formatNumberInput(value) : value;
    setForm((prev) => ({ ...prev, [field]: formatted }));
    setError('');
  };

  const validateForm = () => {
    if (!form.limit_amount || parseNumberInput(form.limit_amount) <= 0) {
      return 'Nominal budget harus lebih dari 0.';
    }

    if (!form.budget_month) {
      return 'Periode budget wajib diisi.';
    }

    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationMessage = validateForm();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Endpoint backend saat ini hanya mengupdate limit_amount.
      // budget_month dan description tetap ditampilkan agar modal reusable dan siap
      // jika endpoint backend nantinya mendukung field tambahan.
      await budgetService.updateBudget(budget.id, {
        limit_amount: parseNumberInput(form.limit_amount),
      });

      toast.success('Budget berhasil diupdate! 📊');
      onSuccess?.();
      onClose?.();
    } catch (err) {
      const message = err.response?.data?.message || 'Gagal mengupdate budget.';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-navy/50 px-4 py-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-xl animate-slide-up overflow-y-auto rounded-brutal border-3 border-navy bg-white shadow-brutal max-h-[90vh]">
        <div className="flex items-start justify-between gap-4 border-b-3 border-navy bg-cream px-5 py-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-brutal border-3 border-navy text-xl shadow-brutal-sm"
              style={{ backgroundColor: `${budget.category_color || '#6366f1'}25` }}
            >
              {budget.category_icon || <HiOutlinePencilAlt className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-navy">Edit Budget</h2>
              <p className="text-xs font-bold text-navy/40">Ubah nominal budget bulanan</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-brutal border-2 border-transparent p-2 text-navy/40 transition-all hover:border-navy hover:bg-white hover:text-navy disabled:opacity-50"
            aria-label="Tutup modal edit budget"
          >
            <HiOutlineX className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-5 py-5">
          {error && (
            <div className="rounded-brutal border-3 border-expense bg-expense/10 px-4 py-3 text-sm font-bold text-expense">
              {error}
            </div>
          )}

          <div className="rounded-brutal border-3 border-navy bg-cream/50 p-4">
            <p className="text-xs font-extrabold uppercase tracking-wider text-navy/40">Nama Budget / Kategori</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-lg font-extrabold text-navy">{budget.category_icon} {budget.category_name}</p>
                <p className="text-xs font-bold text-navy/40">Terpakai {formatRp(budget.spent_amount)} dari budget saat ini</p>
              </div>
              <span className="rounded-full border-2 border-navy bg-white px-3 py-1 text-xs font-extrabold text-navy">
                {budget.percentage || 0}%
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-navy/50">Nominal Budget</label>
              <input
                type="text"
                inputMode="numeric"
                value={form.limit_amount}
                onChange={(e) => handleChange('limit_amount', e.target.value)}
                disabled={submitting}
                className="input-brutal w-full text-lg font-extrabold disabled:opacity-50"
                placeholder="Rp 0"
                required
              />
              <p className="text-xs font-bold text-navy/30">Nominal baru: {formatRp(parseNumberInput(form.limit_amount))}</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-navy/50">Periode Budget</label>
              <input
                type="month"
                value={form.budget_month}
                onChange={(e) => handleChange('budget_month', e.target.value)}
                disabled
                className="input-brutal w-full text-sm opacity-60"
                title="Endpoint backend saat ini hanya mendukung update nominal budget."
              />
              <p className="text-xs font-bold text-navy/30">Periode ditampilkan sebagai informasi.</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-navy/50">Deskripsi</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              disabled
              rows="3"
              className="input-brutal w-full resize-none text-sm opacity-60"
              placeholder="Belum ada deskripsi pada data budget."
              title="Field description belum tersedia pada backend/schema budget saat ini."
            />
            <p className="text-xs font-bold text-navy/30">Field deskripsi belum tersedia pada database budget saat ini.</p>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t-3 border-navy/10 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn-brutal-ghost text-sm disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-brutal border-3 border-navy bg-primary px-6 py-3 text-sm font-extrabold text-white shadow-brutal transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm disabled:opacity-50"
            >
              {submitting ? '⏳ Menyimpan...' : '💾 Save Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBudgetModal;
