import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { formatNumberInput, parseNumberInput } from '../../utils/currencyInput';
import { HiOutlinePencilAlt, HiOutlineX } from 'react-icons/hi';
import billService from '../../services/billService';

const initialForm = {
  name: '',
  amount: '',
  due_day: '',
  category_id: '',
  is_active: true,
  notes: '',
};

const formatRp = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
}).format(Number(value) || 0);

const EditBillModal = ({ isOpen, bill, categories = [], onClose, onSuccess }) => {
  const [form, setForm] = useState(initialForm);
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
    if (!isOpen || !bill) return;

    setForm({
      name: bill.name || '',
      amount: bill.amount ? formatNumberInput(String(Number(bill.amount))) : '',
      due_day: bill.due_day ? String(bill.due_day) : '',
      category_id: bill.category_id ? String(bill.category_id) : '',
      is_active: Boolean(bill.is_active ?? true),
      notes: bill.notes || bill.description || '',
    });
    setError('');
  }, [isOpen, bill]);

  if (!isOpen || !bill) return null;

  const handleChange = (field, value) => {
    const formatted = (field === 'amount') ? formatNumberInput(value) : value;
    setForm((prev) => ({ ...prev, [field]: formatted }));
    setError('');
  };

  const validateForm = () => {
    if (!form.name.trim()) return 'Nama tagihan wajib diisi.';
    if (!form.amount || parseNumberInput(form.amount) <= 0) return 'Nominal tagihan harus lebih dari 0.';

    const dueDay = Number(form.due_day);
    if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
      return 'Tanggal jatuh tempo harus angka 1 sampai 31.';
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
      await billService.updateBill(bill.id, {
        name: form.name.trim(),
        amount: parseNumberInput(form.amount),
        due_day: Number(form.due_day),
        category_id: form.category_id ? Number(form.category_id) : null,
        is_active: form.is_active ? 1 : 0,
      });

      toast.success('Tagihan berhasil diupdate! 🔔');
      onSuccess?.();
      onClose?.();
    } catch (err) {
      const message = err.response?.data?.message || 'Gagal mengupdate tagihan.';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-navy/50 px-4 py-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-2xl animate-slide-up overflow-y-auto rounded-brutal border-3 border-navy bg-white shadow-brutal max-h-[90vh]">
        <div className="flex items-start justify-between gap-4 border-b-3 border-navy bg-cream px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-brutal border-3 border-navy bg-warning/30 text-navy shadow-brutal-sm">
              <HiOutlinePencilAlt className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-navy">Edit Tagihan</h2>
              <p className="text-xs font-bold text-navy/40">Ubah data tagihan rutin bulanan</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-brutal border-2 border-transparent p-2 text-navy/40 transition-all hover:border-navy hover:bg-white hover:text-navy disabled:opacity-50"
            aria-label="Tutup modal edit tagihan"
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-navy/50">Nama Tagihan</label>
              <input
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                disabled={submitting}
                className="input-brutal w-full text-base font-bold disabled:opacity-50"
                placeholder="Contoh: Sewa Kos, Listrik, Internet"
                maxLength="150"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-navy/50">Nominal Tagihan</label>
              <input
                type="text"
                inputMode="numeric"
                value={form.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                disabled={submitting}
                className="input-brutal w-full text-lg font-extrabold disabled:opacity-50"
                placeholder="Rp 0"
                required
              />
              <p className="text-xs font-bold text-navy/30">Nominal: {formatRp(parseNumberInput(form.amount))}</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-navy/50">Tanggal Jatuh Tempo</label>
              <input
                type="number"
                min="1"
                max="31"
                value={form.due_day}
                onChange={(e) => handleChange('due_day', e.target.value)}
                disabled={submitting}
                className="input-brutal w-full text-sm disabled:opacity-50"
                placeholder="1-31"
                required
              />
              <p className="text-xs font-bold text-navy/30">Setiap tanggal {form.due_day || '-'}</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-navy/50">Kategori</label>
              <select
                value={form.category_id}
                onChange={(e) => handleChange('category_id', e.target.value)}
                disabled={submitting}
                className="select-brutal w-full text-sm disabled:opacity-50"
              >
                <option value="">Tanpa kategori</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-navy/50">Status Tagihan</label>
              <select
                value={form.is_active ? 'active' : 'inactive'}
                onChange={(e) => handleChange('is_active', e.target.value === 'active')}
                disabled={submitting}
                className="select-brutal w-full text-sm disabled:opacity-50"
              >
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
              <p className="text-xs font-bold text-navy/30">
                Status bayar bulan ini: {bill.due_status === 'paid' ? 'Lunas' : 'Belum lunas'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-navy/50">Deskripsi / Catatan</label>
            <textarea
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              disabled
              rows="3"
              className="input-brutal w-full resize-none text-sm opacity-60"
              placeholder="Field catatan belum tersedia pada database tagihan saat ini."
              title="Field catatan belum tersedia pada backend/schema tagihan saat ini."
            />
            <p className="text-xs font-bold text-navy/30">Catatan ditampilkan sebagai field siap pakai jika backend nanti mendukung kolom notes/description.</p>
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
              {submitting ? '⏳ Menyimpan...' : '💾 Save Tagihan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBillModal;
