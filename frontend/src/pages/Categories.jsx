import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  HiOutlinePencil,
  HiOutlinePlus,
  HiOutlineTag,
  HiOutlineTrash,
  HiOutlineX,
} from 'react-icons/hi';
import api from '../services/api';

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

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const params = filterType ? { type: filterType } : {};
      const res = await api.get('/categories', { params });
      setCategories(res.data.data || []);
    } catch (error) {
      toast.error('Gagal memuat kategori');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [filterType]);

  const grouped = useMemo(() => ({
    expense: categories.filter((category) => category.type === 'expense'),
    income: categories.filter((category) => category.type === 'income'),
  }), [categories]);

  const resetForm = () => {
    setForm(DEFAULT_FORM);
    setEditingCategory(null);
    setShowForm(false);
  };

  const startCreate = (type = 'expense') => {
    setEditingCategory(null);
    setForm({ ...DEFAULT_FORM, type });
    setShowForm(true);
  };

  const startEdit = (category) => {
    setEditingCategory(category);
    setForm({
      name: category.name,
      icon: category.icon || '📌',
      color: category.color || '#4361EE',
      type: category.type,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      return toast.error('Nama kategori wajib diisi');
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        icon: form.icon.trim() || '📌',
        color: form.color,
        type: form.type,
      };

      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, payload);
        toast.success('Kategori berhasil diperbarui');
      } else {
        await api.post('/categories', payload);
        toast.success('Kategori berhasil ditambahkan');
      }

      resetForm();
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan kategori');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    if (category.is_default) {
      return toast.error('Kategori default tidak bisa dihapus');
    }

    if (!window.confirm(`Hapus kategori "${category.name}"?`)) {
      return;
    }

    try {
      await api.delete(`/categories/${category.id}`);
      toast.success('Kategori berhasil dihapus');
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menghapus kategori');
    }
  };

  const CategorySection = ({ title, description, items, type }) => (
    <section className="brutal-card space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-navy">{title}</h2>
          <p className="text-sm text-navy/45 font-medium mt-1">{description}</p>
        </div>
        <button onClick={() => startCreate(type)} className="btn-brutal text-sm inline-flex items-center gap-2 w-full md:w-auto justify-center">
          <HiOutlinePlus className="w-4 h-4" /> Tambah Kategori
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-brutal border-3 border-dashed border-navy/30 p-8 text-center bg-cream/50">
          <p className="text-4xl mb-3">🏷️</p>
          <p className="text-sm font-bold text-navy/60">Belum ada kategori {type === 'expense' ? 'pengeluaran' : 'pemasukan'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((category) => (
            <div key={category.id} className="bg-white border-3 border-navy rounded-brutal-lg shadow-brutal p-4 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-12 h-12 rounded-brutal border-3 border-navy flex items-center justify-center text-xl shrink-0"
                    style={{ backgroundColor: `${category.color}25` }}
                  >
                    {category.icon || '📌'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-navy truncate">{category.name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className={`text-[11px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full border-2 border-navy ${category.type === 'expense' ? 'bg-expense/10 text-expense' : 'bg-income text-navy'}`}>
                        {category.type === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
                      </span>
                      <span className={`text-[11px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full border-2 border-navy ${category.is_default ? 'bg-secondary text-navy' : 'bg-white text-navy/70'}`}>
                        {category.is_default ? 'Default' : 'Custom'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t-2 border-navy/10">
                <div className="flex items-center gap-2 text-xs font-bold text-navy/50 min-w-0">
                  <span className="w-3 h-3 rounded-full border border-navy shrink-0" style={{ backgroundColor: category.color }} />
                  <span className="truncate">{category.color}</span>
                </div>
                {!category.is_default && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => startEdit(category)}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-brutal border-2 border-navy text-xs font-bold text-navy hover:bg-cream transition-colors"
                    >
                      <HiOutlinePencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category)}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-brutal border-2 border-expense text-xs font-bold text-expense hover:bg-expense hover:text-white transition-colors"
                    >
                      <HiOutlineTrash className="w-3.5 h-3.5" /> Hapus
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-navy">🏷️ Kelola Kategori</h1>
          <p className="text-sm text-navy/45 font-medium mt-2 max-w-2xl">
            Tambahkan, ubah, dan hapus kategori custom untuk pemasukan maupun pengeluaran tanpa mengganggu kategori bawaan sistem.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="select-brutal min-w-[200px]"
          >
            <option value="">Semua Tipe</option>
            {CATEGORY_TYPES.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          <button onClick={() => startCreate(filterType || 'expense')} className="btn-brutal inline-flex items-center justify-center gap-2">
            <HiOutlinePlus className="w-4 h-4" /> Kategori Baru
          </button>
        </div>
      </div>

      {showForm && (
        <div className="brutal-card animate-slide-up">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-bold text-navy">
                {editingCategory ? '✏️ Edit Kategori' : '✨ Tambah Kategori Baru'}
              </h2>
              <p className="text-sm text-navy/45 font-medium mt-1">
                Pilih tipe, ikon, warna, dan nama kategori agar transaksi lebih rapi.
              </p>
            </div>
            <button onClick={resetForm} className="p-2 rounded-brutal border-2 border-navy text-navy hover:bg-cream transition-colors">
              <HiOutlineX className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-navy mb-2">Nama kategori</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-brutal"
                  placeholder="Contoh: Jajan Kopi"
                  maxLength={100}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-navy mb-2">Tipe kategori</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="select-brutal"
                  required
                >
                  {CATEGORY_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-navy mb-2">Ikon / Emoji</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">{form.icon || '📌'}</span>
                  <input
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    className="input-brutal pl-14"
                    placeholder="📌"
                    maxLength={10}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-navy mb-2">Warna kategori</label>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value.toUpperCase() })}
                    className="h-12 w-16 border-3 border-navy rounded-brutal bg-white cursor-pointer"
                  />
                  <input
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value.toUpperCase() })}
                    className="input-brutal flex-1 min-w-[140px]"
                    placeholder="#4361EE"
                    maxLength={7}
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setForm({ ...form, color: preset })}
                      className={`w-8 h-8 rounded-full border-3 border-navy transition-transform hover:scale-105 ${form.color === preset ? 'ring-2 ring-navy/30' : ''}`}
                      style={{ backgroundColor: preset }}
                      aria-label={`Pilih warna ${preset}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-brutal border-3 border-navy bg-cream/60 p-4 flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-brutal border-3 border-navy flex items-center justify-center text-2xl shrink-0"
                style={{ backgroundColor: `${form.color}25` }}
              >
                {form.icon || '📌'}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-navy truncate">{form.name.trim() || 'Preview kategori'}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className={`text-[11px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full border-2 border-navy ${form.type === 'expense' ? 'bg-expense/10 text-expense' : 'bg-income text-navy'}`}>
                    {form.type === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
                  </span>
                  <span className="text-[11px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full border-2 border-navy bg-white text-navy/70">
                    Custom User
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button type="submit" disabled={saving} className="btn-brutal-secondary inline-flex items-center justify-center gap-2">
                <HiOutlineTag className="w-4 h-4" /> {saving ? 'Menyimpan...' : editingCategory ? 'Simpan Perubahan' : 'Tambah Kategori'}
              </button>
              <button type="button" onClick={resetForm} className="btn-brutal-ghost">
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-navy border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {(filterType === '' || filterType === 'expense') && (
            <CategorySection
              title="Kategori Pengeluaran"
              description="Gunakan kategori yang spesifik agar pengeluaran lebih mudah dianalisis."
              items={grouped.expense}
              type="expense"
            />
          )}

          {(filterType === '' || filterType === 'income') && (
            <CategorySection
              title="Kategori Pemasukan"
              description="Pisahkan sumber pemasukan agar laporan keuangan lebih akurat."
              items={grouped.income}
              type="income"
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Categories;
