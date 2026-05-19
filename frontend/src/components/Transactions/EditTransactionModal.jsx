import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { HiOutlinePencilAlt, HiOutlineX } from 'react-icons/hi';
import api from '../../services/api';
import transactionService from '../../services/transactionService';

const initialForm = {
  type: 'expense',
  category_id: '',
  amount: '',
  description: '',
  transaction_date: '',
};

const toDateInputValue = (value) => {
  if (!value) return new Date().toISOString().slice(0, 10);
  return String(value).slice(0, 10);
};

const EditTransactionModal = ({ isOpen, transaction, onClose, onSuccess }) => {
  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !transaction) return;

    setForm({
      type: transaction.type || 'expense',
      category_id: transaction.category_id ? String(transaction.category_id) : '',
      amount: transaction.amount ? String(Number(transaction.amount)) : '',
      description: transaction.description || '',
      transaction_date: toDateInputValue(transaction.transaction_date),
    });
    setError('');
  }, [isOpen, transaction]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const res = await api.get('/categories', { params: { type: form.type } });
        setCategories(res.data.data || []);
      } catch (err) {
        setCategories([]);
        toast.error('Gagal memuat kategori');
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [isOpen, form.type]);

  useEffect(() => {
    if (!isOpen || !transaction) return;

    const categoryStillValid = categories.some((category) => String(category.id) === String(form.category_id));
    if (categories.length > 0 && !categoryStillValid) {
      setForm((prev) => ({ ...prev, category_id: '' }));
    }
  }, [categories, form.category_id, isOpen, transaction]);

  const selectedCategory = useMemo(
    () => categories.find((category) => String(category.id) === String(form.category_id)),
    [categories, form.category_id]
  );

  if (!isOpen || !transaction) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateForm = () => {
    if (!form.type || !['expense', 'income'].includes(form.type)) {
      return 'Tipe transaksi tidak valid.';
    }

    if (!form.category_id) {
      return 'Kategori wajib dipilih.';
    }

    if (!form.amount || Number(form.amount) <= 0) {
      return 'Nominal harus lebih dari 0.';
    }

    if (!form.transaction_date) {
      return 'Tanggal transaksi wajib diisi.';
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
      await transactionService.updateTransaction(transaction.id, {
        type: form.type,
        category_id: Number(form.category_id),
        amount: Number(form.amount),
        description: form.description.trim() || null,
        transaction_date: form.transaction_date,
      });

      toast.success('Transaksi berhasil diupdate! ✏️');
      onSuccess?.();
      onClose?.();
    } catch (err) {
      const message = err.response?.data?.message || 'Gagal mengupdate transaksi.';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/50 px-4 py-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-2xl animate-slide-up rounded-brutal border-3 border-navy bg-white shadow-brutal overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b-3 border-navy bg-cream px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-brutal border-3 border-navy bg-primary text-white shadow-brutal-sm">
              <HiOutlinePencilAlt className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-navy">Edit Transaksi</h2>
              <p className="text-xs font-bold text-navy/40">Ubah data transaksi tanpa membuat ulang</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-brutal border-2 border-transparent p-2 text-navy/40 transition-all hover:border-navy hover:bg-white hover:text-navy disabled:opacity-50"
            aria-label="Tutup modal edit transaksi"
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

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-navy/50">Tipe Transaksi</label>
              <div className="flex overflow-hidden rounded-brutal border-3 border-navy">
                <button
                  type="button"
                  onClick={() => handleChange('type', 'expense')}
                  disabled={submitting}
                  className={`flex-1 py-3 text-sm font-extrabold transition-all ${
                    form.type === 'expense' ? 'bg-expense text-white' : 'bg-white text-navy/40 hover:bg-cream'
                  }`}
                >
                  Pengeluaran
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('type', 'income')}
                  disabled={submitting}
                  className={`flex-1 border-l-3 border-navy py-3 text-sm font-extrabold transition-all ${
                    form.type === 'income' ? 'bg-income text-navy' : 'bg-white text-navy/40 hover:bg-cream'
                  }`}
                >
                  Pemasukan
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-navy/50">Nama/Kategori Transaksi</label>
              <select
                value={form.category_id}
                onChange={(e) => handleChange('category_id', e.target.value)}
                disabled={submitting || loadingCategories}
                className="select-brutal w-full text-sm disabled:opacity-50"
                required
              >
                <option value="">{loadingCategories ? 'Memuat kategori...' : 'Pilih kategori'}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
              {selectedCategory && (
                <p className="text-xs font-bold text-navy/40">Terpilih: {selectedCategory.icon} {selectedCategory.name}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-navy/50">Nominal</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={form.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                disabled={submitting}
                className="input-brutal w-full text-lg font-extrabold disabled:opacity-50"
                placeholder="Rp 0"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-navy/50">Tanggal Transaksi</label>
              <input
                type="date"
                value={form.transaction_date}
                onChange={(e) => handleChange('transaction_date', e.target.value)}
                disabled={submitting}
                className="input-brutal w-full text-sm disabled:opacity-50"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-navy/50">Deskripsi</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              disabled={submitting}
              rows="4"
              maxLength="255"
              className="input-brutal w-full resize-none text-sm disabled:opacity-50"
              placeholder="Contoh: Makan siang, bayar kos, freelance project..."
            />
            <p className="text-right text-xs font-bold text-navy/30">{form.description.length}/255</p>
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
              disabled={submitting || loadingCategories}
              className="rounded-brutal border-3 border-navy bg-primary px-6 py-3 text-sm font-extrabold text-white shadow-brutal transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm disabled:opacity-50"
            >
              {submitting ? '⏳ Menyimpan...' : '💾 Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTransactionModal;
