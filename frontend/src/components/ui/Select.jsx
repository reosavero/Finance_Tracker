import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { HiOutlineChevronDown, HiOutlineCheck } from 'react-icons/hi';

/**
 * Select — Custom dropdown generik dengan sudut lengkung (neubrutalism),
 * di-portal ke document.body agar tidak tertimpa card/modal lain.
 *
 * @param {string}   value       — selected value
 * @param {func}     onChange     — callback(value: string)
 * @param {array}    options      — [{ value, label, icon?, disabled? }]
 * @param {boolean}  disabled
 * @param {string}   placeholder — teks placeholder
 * @param {string}   className   — class wrapper (misal: flex-1, w-full)
 */
const Select = ({
  value,
  onChange,
  options = [],
  disabled,
  placeholder = 'Pilih',
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef(null);
  const portalRef = useRef(null);

  const updatePos = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  }, []);

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

  const selected = options.find((o) => String(o.value) === String(value));

  return (
    <div className={className}>
      {/* Trigger */}
      <button
        ref={btnRef}
        type="button"
        onClick={() => { setOpen((prev) => !prev); updatePos(); }}
        disabled={disabled}
        className={`input-brutal w-full text-left flex items-center justify-between gap-2 text-sm ${
          value ? 'text-navy font-bold' : 'text-navy/30 font-medium'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className="truncate flex items-center gap-2">
          {selected?.icon && <span className="shrink-0">{selected.icon}</span>}
          {selected ? selected.label : placeholder}
        </span>
        <HiOutlineChevronDown className={`w-4 h-4 shrink-0 text-navy/40 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown — portal ke body */}
      {open && createPortal(
        <div
          ref={portalRef}
          style={{ position: 'absolute', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
          className="max-h-52 overflow-y-auto rounded-brutal border-3 border-navy bg-white shadow-brutal-lg animate-pop"
        >
          {options.length === 0 && (
            <div className="px-4 py-3 text-xs font-medium text-navy/40">Tidak ada opsi</div>
          )}
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            const isDisabled = opt.disabled;

            return (
              <button
                key={opt.value}
                type="button"
                disabled={isDisabled}
                onClick={() => {
                  if (!isDisabled) {
                    onChange(opt.value);
                    setOpen(false);
                  }
                }}
                className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors first:rounded-t-brutal last:rounded-b-brutal ${
                  isDisabled
                    ? 'cursor-not-allowed text-navy/30 bg-cream/50'
                    : isSelected
                      ? 'bg-primary/10 font-bold text-navy'
                      : 'font-medium text-navy/70 hover:bg-cream'
                }`}
              >
                {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                <span className="flex-1 truncate">{opt.label}</span>
                {isSelected && !isDisabled && (
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

export default Select;