import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { HiOutlinePencilAlt, HiOutlinePlus, HiOutlineX } from 'react-icons/hi';
import api from '../../services/api';

const CATEGORY_TYPES = [
  { value: 'expense', label: 'Pengeluaran' },
  { value: 'income', label: 'Pemasukan' },
];

const COLOR_PRESETS = ['#4361EE', '#06D6A0', '#EF476F', '#F77F00', '#7209B7', '#FFD60A', '#3B82F6', '#10B981'];

const DEFAULT_FORM = {
  name: '',
  icon: '📌',
  color: '#4361EE',
  type: 'expense',
};

const EditCategoryModal = ({ isOpen, category, onClose, onSuccess }) => {
  const isEditing = !!category;
  const isDefault = category?.is_default ?? false;

  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
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
    if (!isOpen) return;

    if (category) {
      setForm({
        name: category.name || '',
        icon: category.icon || '📌',
        color: category.color || '#4361EE',
        type: category.type || 'expense',
      });
    } else {
      setForm({ ...DEFAULT_FORM });
    }
    setError('');
  }, [isOpen, category]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('Nama kategori wajib diisi');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        icon: form.icon.trim() || '📌',
        color: form.color,
        type: form.type,
      };

      if (isEditing) {
        await api.put(`/categories/${category.id}`, payload);
        toast.success('Kategori berhasil diperbarui ✅');
      } else {
        await api.post('/categories', payload);
        toast.success('Kategori berhasil ditambahkan 🎉');
      }

      onSuccess?.();
      onClose?.();
    } catch (err) {
      const message = err.response?.data?.message || 'Gagal menyimpan kategori';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-navy/50 px-4 py-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-xl animate-slide-up overflow-y-auto rounded-brutal border-3 border-navy bg-white shadow-brutal max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b-3 border-navy bg-cream px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-brutal border-3 border-navy bg-primary/20 shadow-brutal-sm">
              {isEditing ? (
                <HiOutlinePencilAlt className="h-5 w-5 text-navy" />
              ) : (
                <HiOutlinePlus className="h-5 w-5 text-navy" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-navy">
                {isEditing ? 'Edit Kategori' : 'Kategori Baru'}
              </h2>
              <p className="text-xs font-bold text-navy/40">
                {isDefault ? 'Kategori bawaan — tipe tidak dapat diubah' : 'Isi detail kategori baru'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-brutal border-2 border-transparent p-2 text-navy/40 transition-all hover:border-navy hover:bg-white hover:text-navy disabled:opacity-50"
            aria-label="Tutup"
          >
            <HiOutlineX className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 px-5 py-5">
          {error && (
            <div className="rounded-brutal border-3 border-expense bg-expense/10 px-4 py-3 text-sm font-bold text-expense">
              {error}
            </div>
          )}

          {isDefault && (
            <div className="rounded-brutal border-3 border-warning bg-warning/10 px-4 py-3 text-sm font-bold text-navy">
              ⚠️ Ini adalah kategori bawaan sistem. Anda bisa mengubah nama, ikon, dan warna, tetapi tipe kategori tidak dapat diubah.
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Nama */}
            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-navy/50">
                Nama Kategori
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                disabled={saving}
                className="input-brutal w-full text-base font-bold disabled:opacity-50"
                placeholder="Contoh: Jajan Kopi"
                maxLength={100}
                required
              />
            </div>

            {/* Tipe */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-navy/50">
                Tipe Kategori
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                disabled={saving || isDefault}
                className="select-brutal w-full text-sm disabled:opacity-50"
                required
              >
                {CATEGORY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Ikon */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-navy/50">
                Ikon / Emoji
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">{form.icon || '📌'}</span>
                <input
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  disabled={saving}
                  className="input-brutal w-full pl-14 disabled:opacity-50"
                  placeholder="📌"
                  maxLength={10}
                />
              </div>
            </div>

            {/* Warna */}
            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-navy/50">
                Warna Kategori
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value.toUpperCase() })}
                  className="h-12 w-16 shrink-0 cursor-pointer rounded-brutal border-3 border-navy bg-white"
                />
                <input
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value.toUpperCase() })}
                  disabled={saving}
                  className="input-brutal min-w-[120px] flex-1 disabled:opacity-50"
                  placeholder="#4361EE"
                  maxLength={7}
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setForm({ ...form, color: preset })}
                    className={`h-8 w-8 rounded-full border-3 transition-transform hover:scale-110 ${
                      form.color === preset ? 'border-navy ring-2 ring-navy/30 scale-110' : 'border-navy/20'
                    }`}
                    style={{ backgroundColor: preset }}
                    aria-label={`Pilih warna ${preset}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-brutal border-3 border-navy bg-cream/60 p-4">
            <p className="mb-3 text-xs font-extrabold uppercase tracking-wider text-navy/40">Preview</p>
            <div className="flex items-center gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-brutal border-3 border-navy text-2xl"
                style={{ backgroundColor: `${form.color}25` }}
              >
                {form.icon || '📌'}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-navy">{form.name.trim() || 'Nama Kategori'}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className={`badge-brutal text-[10px] ${form.type === 'expense' ? 'bg-expense/10 text-expense' : 'bg-income text-navy'}`}>
                    {form.type === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
                  </span>
                  <span className="badge-brutal bg-white text-[10px] text-navy/70">
                    {isDefault ? 'Default' : 'Custom'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 border-t-3 border-navy/10 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn-brutal-ghost text-sm disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-brutal border-3 border-navy bg-primary px-6 py-3 text-sm font-extrabold text-white shadow-brutal transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm disabled:opacity-50"
            >
              {saving ? '⏳ Menyimpan...' : isEditing ? '💾 Simpan Perubahan' : '✨ Tambah Kategori'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCategoryModal;