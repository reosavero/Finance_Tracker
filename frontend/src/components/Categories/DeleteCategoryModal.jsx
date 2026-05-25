import { HiOutlineExclamation, HiOutlineX } from 'react-icons/hi';

const DeleteCategoryModal = ({ isOpen, category, onClose, onConfirm, loading }) => {
  if (!isOpen || !category) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/50 px-4 py-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md animate-slide-up overflow-hidden rounded-brutal border-3 border-navy bg-white shadow-brutal">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b-3 border-navy bg-expense/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-brutal border-3 border-navy bg-expense/20 text-expense shadow-brutal-sm">
              <HiOutlineExclamation className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-navy">Hapus Kategori</h2>
              <p className="text-xs font-bold text-navy/40">Tindakan ini tidak dapat dibatalkan</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-brutal border-2 border-transparent p-2 text-navy/40 transition-all hover:border-navy hover:bg-white hover:text-navy disabled:opacity-50"
            aria-label="Tutup"
          >
            <HiOutlineX className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-5 py-5">
          <p className="text-sm font-medium text-navy/70">
            Apakah Anda yakin ingin menghapus kategori ini? Semua data yang terkait mungkin terpengaruh.
          </p>

          {/* Category preview */}
          <div className="flex items-center gap-4 rounded-brutal border-3 border-navy bg-cream/60 p-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-brutal border-3 border-navy text-2xl"
              style={{ backgroundColor: `${category.color || '#4361EE'}25` }}
            >
              {category.icon || '📌'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-navy">{category.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className={`badge-brutal text-[10px] ${category.type === 'expense' ? 'bg-expense/10 text-expense' : 'bg-income text-navy'}`}>
                  {category.type === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
                </span>
                {category.is_default && (
                  <span className="badge-brutal bg-secondary text-[10px] text-navy">Default</span>
                )}
              </div>
            </div>
          </div>

          {category.is_default && (
            <div className="rounded-brutal border-3 border-warning bg-warning/10 px-4 py-3 text-sm font-bold text-navy">
              ⚠️ Kategori bawaan sistem tidak dapat dihapus. Hanya kategori custom yang bisa dihapus.
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 border-t-3 border-navy/10 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="btn-brutal-ghost text-sm disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading || category.is_default}
            className="rounded-brutal border-3 border-expense bg-expense px-6 py-3 text-sm font-extrabold text-white shadow-brutal transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm disabled:opacity-50"
          >
            {loading ? '⏳ Menghapus...' : '🗑️ Hapus Kategori'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteCategoryModal;