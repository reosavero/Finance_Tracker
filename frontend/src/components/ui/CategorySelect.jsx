import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { HiOutlineChevronDown, HiOutlineCheck } from 'react-icons/hi';

const formatRp = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
}).format(Math.round(Number(value) || 0));

/**
 * CategorySelect — Custom dropdown kategori dengan sudut lengkung
 * (neubrutalism), di-portal ke document.body agar tidak tertimpa card lain.
 *
 * @param {string} value       — selected category id
 * @param {func}   onChange    — callback(id: string)
 * @param {array}  categories  — daftar kategori [{id, name, icon, ...}]
 * @param {Map}    budgetMap   — (opsional) Map<categoryId, budget> untuk info sisa/lock
 * @param {string} type        — 'expense' | 'income' (untuk cek budget)
 * @param {boolean} disabled
 * @param {string} placeholder — teks placeholder default
 */
const CategorySelect = ({
  value,
  onChange,
  categories = [],
  budgetMap,
  type,
  disabled,
  placeholder = 'Pilih Kategori',
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef(null);
  const portalRef = useRef(null);

  // Hitung posisi dropdown berdasarkan posisi trigger button
  const updatePos = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  }, []);

  // Update posisi saat buka & saat scroll/resize
  useEffect(() => {
    if (!open) return;
    updatePos();
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);
    return () => {
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
    };
  }, [open, updatePos]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target) &&
        portalRef.current && !portalRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const selected = categories.find((c) => String(c.id) === String(value));

  return (
    <div className={className}>
      {/* Trigger button */}
      <button
        ref={btnRef}
        type="button"
        onClick={() => { setOpen((prev) => !prev); updatePos(); }}
        disabled={disabled}
        className={`input-brutal w-full text-left flex items-center justify-between gap-2 text-sm ${
          value ? 'text-navy font-bold' : 'text-navy/30 font-medium'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className="truncate">
          {selected ? `${selected.icon} ${selected.name}` : placeholder}
        </span>
        <HiOutlineChevronDown className={`w-4 h-4 shrink-0 text-navy/40 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown panel — portal ke body agar tidak tertimpa card lain */}
      {open && createPortal(
        <div
          ref={portalRef}
          style={{ position: 'absolute', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
          className="max-h-52 overflow-y-auto rounded-brutal border-3 border-navy bg-white shadow-brutal-lg animate-pop"
        >
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
        </div>,
        document.body
      )}
    </div>
  );
};

export default CategorySelect;