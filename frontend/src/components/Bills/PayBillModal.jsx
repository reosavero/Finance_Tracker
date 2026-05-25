import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import billService from '../../services/billService';
import toast from 'react-hot-toast';
import {
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineExclamation,
} from 'react-icons/hi';
import {
  HiOutlineBanknotes,
} from 'react-icons/hi2';

const formatRp = (n) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(Number(n) || 0));

// =====================================================
// PayBillModal — Konfirmasi pembayaran tagihan
// Menampilkan info saldo, validasi, dan success state
// =====================================================
const PayBillModal = ({ isOpen, bill, onClose, onSuccess }) => {
  const [balance, setBalance] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

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

  const fetchBalance = useCallback(async () => {
    setLoadingBalance(true);
    setError('');
    try {
      const res = await api.get('/dashboard/summary', {
        params: { _t: Date.now() },
      });
      const d = res.data.data;
      const ma = Number(d.monthly_allowance) || 0;
      const ti = Number(d.total_income) || 0;
      const te = Number(d.total_expense) || 0;
      // Hitung balance di frontend supaya selalu akurat
      const calculatedBalance = ma + ti - te;
      setBalance({
        current_balance: calculatedBalance,
        monthly_allowance: ma,
        total_income: ti,
        total_expense: te,
      });
    } catch {
      setError('Gagal memuat informasi saldo. Coba lagi.');
    } finally {
      setLoadingBalance(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !bill) return;
    setSuccessData(null);
    setPaying(false);
    setError('');
    fetchBalance();
  }, [isOpen, bill, fetchBalance]);

  if (!isOpen || !bill) return null;

  const billAmount = parseFloat(bill.amount) || 0;
  const currentBalance = balance?.current_balance ?? null;
  const remainingBalance = currentBalance !== null ? currentBalance - billAmount : null;
  const isInsufficient = currentBalance !== null && currentBalance < billAmount;

  const handlePay = async () => {
    setPaying(true);
    setError('');
    try {
      const res = await billService.markBillPaid(bill.id);
      setSuccessData(res.data.data);
      toast.success(res.data.message || 'Tagihan berhasil dibayar! ✅', {
        duration: 4000,
        icon: '🎉',
      });
      // Tunggu user klik "Tutup" — jangan auto-close
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal membayar tagihan. Coba lagi.';
      setError(msg);
      if (err.response?.data?.data) {
        const detail = err.response.data.data;
        // Hitung balance terbaru dari field individual
        if (detail.monthly_allowance !== undefined) {
          const ma = Number(detail.monthly_allowance) || 0;
          const ti = Number(detail.total_income) || 0;
          const te = Number(detail.total_expense) || 0;
          setBalance((prev) => ({
            ...prev,
            current_balance: ma + ti - te,
          }));
        } else if (detail.current_balance !== undefined) {
          setBalance((prev) => ({
            ...prev,
            current_balance: Number(detail.current_balance),
          }));
        }
      }
    } finally {
      setPaying(false);
    }
  };

  const handleClose = () => {
    if (paying) return;
    if (successData) {
      onSuccess?.();
    }
    onClose?.();
  };

  // ===================== SUCCESS STATE =====================
  if (successData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-navy/60 px-4 py-4 backdrop-blur-sm" onClick={handleClose}>
        <div
          className="w-full max-w-md animate-bounce-in overflow-y-auto rounded-brutal-lg border-3 border-navy bg-white shadow-brutal-lg max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header sukses */}
          <div className="border-b-3 border-navy bg-income px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-brutal border-3 border-navy bg-white shadow-brutal-sm">
                <HiOutlineCheck className="h-7 w-7 text-income" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-navy">Pembayaran Berhasil!</h2>
                <p className="text-sm font-bold text-navy/70">Tagihan sudah lunas</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 px-6 py-5">
            {/* Detail tagihan yang dibayar */}
            <div className="rounded-brutal border-3 border-navy bg-cream/50 p-4">
              <p className="text-xs font-extrabold uppercase tracking-wider text-navy/50 mb-2">📋 Detail Pembayaran</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-navy/70">Tagihan</span>
                  <span className="font-bold text-navy">{successData.bill?.name || bill.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-navy/70">Nominal</span>
                  <span className="font-bold text-expense">−{formatRp(successData.balance?.deducted || billAmount)}</span>
                </div>
                {successData.transaction?.category_name && (
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-navy/70">Kategori</span>
                    <span className="font-bold text-navy">
                      {successData.transaction.category_icon} {successData.transaction.category_name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Update saldo */}
            <div className="rounded-brutal border-3 border-navy bg-secondary/20 p-4">
              <p className="text-xs font-extrabold uppercase tracking-wider text-navy/50 mb-2">💰 Update Saldo</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-navy/70">Saldo sebelum</span>
                  <span className="font-bold text-navy">{formatRp(successData.balance?.previous)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-navy/70">Dibayarkan</span>
                  <span className="font-bold text-expense">−{formatRp(successData.balance?.deducted)}</span>
                </div>
                <div className="border-t-2 border-navy/10 my-1" />
                <div className="flex justify-between text-sm">
                  <span className="font-extrabold text-navy">Sisa saldo</span>
                  <span className="font-extrabold text-income text-base">{formatRp(successData.balance?.current)}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="btn-brutal-secondary w-full mt-2"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===================== CONFIRMATION STATE =====================
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-navy/60 px-4 py-4 backdrop-blur-sm" onClick={handleClose}>
      <div
        className="w-full max-w-md animate-slide-up overflow-y-auto rounded-brutal-lg border-3 border-navy bg-white shadow-brutal-lg max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b-3 border-navy bg-cream px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-brutal border-3 border-navy bg-warning/30 shadow-brutal-sm">
              <HiOutlineBanknotes className="h-5 w-5 text-navy" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-navy">Konfirmasi Pembayaran</h2>
              <p className="text-xs font-bold text-navy/50">Pastikan detail tagihan benar</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={paying}
            className="rounded-brutal border-2 border-transparent p-2 text-navy/40 transition-all hover:border-navy hover:bg-white hover:text-navy disabled:opacity-50"
            aria-label="Tutup modal"
          >
            <HiOutlineX className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          {/* Detail tagihan */}
          <div className="rounded-brutal border-3 border-navy bg-white p-4">
            <p className="text-xs font-extrabold uppercase tracking-wider text-navy/50 mb-3">📋 Detail Tagihan</p>
            <div className="space-y-2">
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-navy text-base truncate">{bill.name}</p>
                  <p className="text-xs font-medium text-navy/50">
                    Jatuh tempo setiap tanggal {bill.due_day}
                    {bill.category_name && ` • ${bill.category_icon || '💰'} ${bill.category_name}`}
                  </p>
                </div>
                <span className="shrink-0 text-lg font-black text-expense">
                  {formatRp(billAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Info saldo */}
          {loadingBalance ? (
            <div className="rounded-brutal border-3 border-navy/20 bg-cream/50 p-4 animate-pulse">
              <div className="h-4 w-32 rounded bg-navy/10 mb-3" />
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-navy/10" />
                <div className="h-3 w-3/4 rounded bg-navy/10" />
                <div className="h-3 w-1/2 rounded bg-navy/10" />
              </div>
            </div>
          ) : balance ? (
            <div className={`rounded-brutal border-3 p-4 ${
              isInsufficient
                ? 'border-expense bg-expense/5'
                : 'border-navy bg-secondary/10'
            }`}>
              <p className="text-xs font-extrabold uppercase tracking-wider text-navy/50 mb-3">
                💰 Informasi Saldo
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-navy/70">Saldo saat ini</span>
                  <span className="font-bold text-navy">{formatRp(currentBalance)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-navy/70">Nominal tagihan</span>
                  <span className="font-bold text-expense">−{formatRp(billAmount)}</span>
                </div>
                <div className="border-t-2 border-navy/10 my-1" />
                <div className="flex justify-between text-sm">
                  <span className="font-extrabold text-navy">Sisa setelah bayar</span>
                  <span className={`font-extrabold text-base ${
                    isInsufficient ? 'text-expense' : 'text-income'
                  }`}>
                    {formatRp(remainingBalance)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-brutal border-3 border-warning bg-warning/10 p-4">
              <p className="text-sm font-bold text-navy">
                ⚠️ Tidak dapat memuat info saldo. Anda tetap bisa melanjutkan pembayaran.
              </p>
            </div>
          )}

          {/* Peringatan saldo tidak cukup */}
          {isInsufficient && (
            <div className="rounded-brutal border-3 border-expense bg-expense/10 p-4 animate-bounce-in">
              <div className="flex items-start gap-3">
                <HiOutlineExclamation className="h-6 w-6 text-expense shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-expense text-sm">Saldo Tidak Mencukupi!</p>
                  <p className="text-xs font-medium text-navy/70 mt-1">
                    Saldo Anda {formatRp(currentBalance)} kurang {formatRp(billAmount - currentBalance)} untuk membayar tagihan ini.
                    Tambah pemasukan atau sesuaikan uang bulanan di halaman Profil.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error dari server */}
          {error && !isInsufficient && (
            <div className="rounded-brutal border-3 border-expense bg-expense/10 p-4">
              <div className="flex items-start gap-3">
                <HiOutlineExclamation className="h-5 w-5 text-expense shrink-0 mt-0.5" />
                <p className="text-sm font-bold text-expense">{error}</p>
              </div>
            </div>
          )}

          {/* Info transaksi otomatis */}
          {!isInsufficient && (
            <div className="rounded-brutal border-2 border-navy/10 bg-cream/50 p-3">
              <p className="text-xs font-bold text-navy/50 leading-relaxed">
                📝 Pembayaran akan otomatis mencatat transaksi pengeluaran pada kategori <strong>{bill.category_name || 'Tagihan & Utilitas'}</strong> dan mengurangi saldo Anda.
              </p>
            </div>
          )}

          {/* Tombol aksi */}
          <div className="flex flex-col-reverse gap-3 border-t-3 border-navy/10 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={paying}
              className="btn-brutal-ghost text-sm disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handlePay}
              disabled={paying || isInsufficient}
              className={`flex items-center justify-center gap-2 rounded-brutal border-3 border-navy px-6 py-3 text-sm font-extrabold shadow-brutal transition-all duration-150
                hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm
                active:translate-x-[4px] active:translate-y-[4px] active:shadow-brutal-none
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-brutal
                ${
                  isInsufficient
                    ? 'bg-navy/10 text-navy/40'
                    : 'bg-income text-navy hover:-translate-y-0.5'
                }`}
            >
              {paying ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-3 border-navy border-t-transparent" />
                  Memproses...
                </>
              ) : (
                <>
                  <HiOutlineBanknotes className="h-4 w-4" />
                  {isInsufficient ? 'Saldo Tidak Cukup' : '✅ Konfirmasi Pembayaran'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayBillModal;