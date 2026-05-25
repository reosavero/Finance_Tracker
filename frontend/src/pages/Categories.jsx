import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  HiOutlineDotsVertical,
  HiOutlinePencil,
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineTrash,
} from 'react-icons/hi';
import api from '../services/api';
import EditCategoryModal from '../components/Categories/EditCategoryModal';
import DeleteCategoryModal from '../components/Categories/DeleteCategoryModal';

const CATEGORY_TYPES = [
  { value: 'expense', label: 'Pengeluaran', emoji: '💸' },
  { value: 'income', label: 'Pemasukan', emoji: '💰' },
];

const EMOJI_QUICK_PICKS = ['🍔', '🚗', '🏠', '💡', '📱', '🎮', '💊', '✈️', '📚', '👕', '🎁', '☕', '🏋️', '🎵', '🛒', '💰'];

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [editModal, setEditModal] = useState({ open: false, category: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, category: null });
  const [deleting, setDeleting] = useState(false);

  // Dropdown state for mobile actions
  const [openActionId, setOpenActionId] = useState(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const params = filterType ? { type: filterType } : {};
      const res = await api.get('/categories', { params });
      setCategories(res.data.data || []);
    } catch {
      toast.error('Gagal memuat kategori');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [filterType]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = () => setOpenActionId(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const filtered = useMemo(() => {
    let result = categories;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(q));
    }
    return result;
  }, [categories, searchQuery]);

  const grouped = useMemo(() => ({
    expense: filtered.filter((c) => c.type === 'expense'),
    income: filtered.filter((c) => c.type === 'income'),
  }), [filtered]);

  const handleDelete = async () => {
    const category = deleteModal.category;
    if (!category) return;

    setDeleting(true);
    try {
      await api.delete(`/categories/${category.id}`);
      toast.success('Kategori berhasil dihapus 🗑️');
      setDeleteModal({ open: false, category: null });
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus kategori');
    } finally {
      setDeleting(false);
    }
  };

  const CategoryCard = ({ category }) => {
    const isDefault = category.is_default;
    const isOpen = openActionId === category.id;
    const btnRef = useRef(null);
    const [dropUp, setDropUp] = useState(false);

    const handleToggle = (e) => {
      e.stopPropagation();
      if (openActionId === category.id) {
        setOpenActionId(null);
      } else {
        // Deteksi apakah tombol dekat bawah viewport → dropdown muncul ke atas
        if (btnRef.current) {
          const rect = btnRef.current.getBoundingClientRect();
          const spaceBelow = window.innerHeight - rect.bottom;
          setDropUp(spaceBelow < 120);
        }
        setOpenActionId(category.id);
      }
    };

    return (
      <div
        className={`group relative bg-white border-3 border-navy rounded-brutal shadow-brutal transition-all duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[8px_8px_0px_#1A1A2E] ${
          isOpen ? 'z-30' : ''
        }`}
      >
        {/* Main content */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-brutal border-3 border-navy text-xl"
              style={{ backgroundColor: `${category.color || '#4361EE'}25` }}
            >
              {category.icon || '📌'}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold text-navy">{category.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className={`badge-brutal text-[10px] ${category.type === 'expense' ? 'bg-expense/10 text-expense' : 'bg-income text-navy'}`}>
                  {category.type === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
                </span>
                {isDefault ? (
                  <span className="badge-brutal bg-secondary text-[10px] text-navy">Default</span>
                ) : (
                  <span className="badge-brutal bg-white text-[10px] text-navy/50">Custom</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="relative shrink-0">
              <button
                ref={btnRef}
                onClick={handleToggle}
                className={`flex h-8 w-8 items-center justify-center rounded-brutal border-2 transition-all ${
                  isOpen ? 'border-navy bg-cream text-navy' : 'border-navy/20 text-navy/40 hover:border-navy hover:bg-cream hover:text-navy'
                }`}
                aria-label="Menu aksi"
              >
                <HiOutlineDotsVertical className="h-4 w-4" />
              </button>

              {isOpen && (
                <div
                  className={`absolute right-0 z-50 min-w-[180px] animate-pop rounded-brutal border-3 border-navy bg-white shadow-brutal-lg ${
                    dropUp ? 'bottom-full mb-2' : 'top-full mt-2'
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      setOpenActionId(null);
                      setEditModal({ open: true, category });
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-bold text-navy transition-colors hover:bg-cream"
                  >
                    <HiOutlinePencil className="h-4 w-4" />
                    Edit Kategori
                  </button>

                  <div className="border-t-2 border-navy/10" />

                  <button
                    onClick={() => {
                      if (isDefault) {
                        toast.error('Kategori bawaan tidak dapat dihapus');
                        setOpenActionId(null);
                        return;
                      }
                      setOpenActionId(null);
                      setDeleteModal({ open: true, category });
                    }}
                    className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-bold transition-colors ${
                      isDefault
                        ? 'cursor-not-allowed text-navy/30'
                        : 'text-expense hover:bg-expense/10'
                    }`}
                    disabled={isDefault}
                  >
                    <HiOutlineTrash className="h-4 w-4" />
                    {isDefault ? 'Tidak dapat dihapus' : 'Hapus Kategori'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Color swatch */}
          <div className="mt-3 flex items-center gap-2 border-t-2 border-navy/10 pt-3">
            <span
              className="h-4 w-4 shrink-0 rounded-full border-3 border-navy"
              style={{ backgroundColor: category.color || '#4361EE' }}
            />
            <span className="text-[11px] font-bold text-navy/40">{category.color || '#4361EE'}</span>
          </div>
        </div>
      </div>
    );
  };

  const CategorySection = ({ title, description, items, type }) => {
    const typeInfo = CATEGORY_TYPES.find((t) => t.value === type);
    const totalDefault = items.filter((c) => c.is_default).length;
    const totalCustom = items.filter((c) => !c.is_default).length;

    return (
      <section className="brutal-card space-y-5">
        {/* Section header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{typeInfo?.emoji}</span>
              <h2 className="text-lg font-extrabold text-navy">{title}</h2>
            </div>
            <p className="mt-1 text-sm text-navy/45 font-medium">{description}</p>
            <div className="mt-2 flex items-center gap-3 text-xs font-bold">
              <span className="badge-brutal bg-cream text-navy/60">{totalDefault} bawaan</span>
              <span className="badge-brutal bg-white text-navy/60">{totalCustom} custom</span>
              <span className="text-navy/30">{items.length} total</span>
            </div>
          </div>
          <button
            onClick={() => setEditModal({ open: true, category: null })}
            className="btn-brutal-secondary inline-flex items-center justify-center gap-2 text-sm"
          >
            <HiOutlinePlus className="h-4 w-4" /> Tambah
          </button>
        </div>

        {/* Cards */}
        {items.length === 0 ? (
          <div className="rounded-brutal border-3 border-dashed border-navy/20 bg-cream/50 p-10 text-center">
            <p className="text-4xl">{typeInfo?.emoji || '🏷️'}</p>
            <p className="mt-3 text-sm font-bold text-navy/50">
              Belum ada kategori {type === 'expense' ? 'pengeluaran' : 'pemasukan'}
            </p>
            <button
              onClick={() => setEditModal({ open: true, category: null })}
              className="btn-brutal-secondary mt-4 inline-flex items-center gap-2 text-sm"
            >
              <HiOutlinePlus className="h-4 w-4" /> Tambah Kategori Pertama
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-navy md:text-3xl">🏷️ Kelola Kategori</h1>
          <p className="mt-2 max-w-2xl text-sm font-medium text-navy/45">
            Tambah, ubah, dan hapus kategori untuk mengelompokkan pemasukan serta pengeluaranmu.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row lg:w-auto">
          <button
            onClick={() => setEditModal({ open: true, category: null })}
            className="btn-brutal inline-flex items-center justify-center gap-2"
          >
            <HiOutlinePlus className="h-4 w-4" /> Kategori Baru
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="brutal-card flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/30" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-brutal pl-11"
            placeholder="Cari kategori..."
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('')}
            className={`badge-brutal cursor-pointer transition-all ${
              filterType === '' ? 'bg-primary text-white border-primary' : 'bg-white text-navy/60 hover:bg-cream'
            }`}
          >
            Semua
          </button>
          {CATEGORY_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setFilterType(t.value)}
              className={`badge-brutal cursor-pointer transition-all ${
                filterType === t.value
                  ? t.value === 'expense' ? 'bg-expense text-white border-expense' : 'bg-income text-navy border-income'
                  : 'bg-white text-navy/60 hover:bg-cream'
              }`}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="brutal-card-sm text-center">
          <p className="text-2xl font-extrabold text-navy">{categories.length}</p>
          <p className="text-xs font-bold text-navy/40">Total</p>
        </div>
        <div className="brutal-card-sm text-center">
          <p className="text-2xl font-extrabold text-expense">{grouped.expense.length}</p>
          <p className="text-xs font-bold text-navy/40">Pengeluaran</p>
        </div>
        <div className="brutal-card-sm text-center">
          <p className="text-2xl font-extrabold text-income">{grouped.income.length}</p>
          <p className="text-xs font-bold text-navy/40">Pemasukan</p>
        </div>
        <div className="brutal-card-sm text-center">
          <p className="text-2xl font-extrabold text-navy">{categories.filter((c) => !c.is_default).length}</p>
          <p className="text-xs font-bold text-navy/40">Custom</p>
        </div>
      </div>

      {/* Category sections */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-navy border-t-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {(filterType === '' || filterType === 'expense') && (
            <CategorySection
              title="Kategori Pengeluaran"
              description="Kelompokkan pengeluaranmu agar lebih mudah dianalisis."
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

      {/* Edit/Create Modal */}
      <EditCategoryModal
        isOpen={editModal.open}
        category={editModal.category}
        onClose={() => setEditModal({ open: false, category: null })}
        onSuccess={fetchCategories}
      />

      {/* Delete Modal */}
      <DeleteCategoryModal
        isOpen={deleteModal.open}
        category={deleteModal.category}
        onClose={() => setDeleteModal({ open: false, category: null })}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
};

export default Categories;