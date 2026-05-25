import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HiOutlineChevronRight,
  HiOutlineExclamation,
  HiOutlineCash,
} from 'react-icons/hi';
import PayBillModal from '../Bills/PayBillModal';
import api from '../../services/api';

const formatRp = (n) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(Number(n) || 0));

const STATUS_ORDER = ['overdue', 'due_soon', 'upcoming', 'paid'];

const STATUS_CONFIG = {
  overdue: {
    label: 'Terlambat',
    emoji: '🔴',
    cardBorder: 'border-expense',
    cardBg: 'bg-expense/5',
    badgeCls: 'bg-expense text-white border-navy',
  },
  due_soon: {
    label: 'Segera',
    emoji: '🟡',
    cardBorder: 'border-warning',
    cardBg: 'bg-warning/5',
    badgeCls: 'bg-warning text-navy border-navy',
  },
  upcoming: {
    label: 'Mendatang',
    emoji: '⏳',
    cardBorder: 'border-navy/30',
    cardBg: 'bg-white',
    badgeCls: 'bg-cream text-navy/60 border-navy/40',
  },
  paid: {
    label: 'Lunas',
    emoji: '✅',
    cardBorder: 'border-income',
    cardBg: 'bg-income/5',
    badgeCls: 'bg-income text-navy border-navy',
  },
};

// =====================================================
// UpcomingBills — Widget tagihan di Dashboard
// Grouped by urgency, expandable, link ke halaman Bills
// =====================================================
const UpcomingBills = ({ bills = [], onPaySuccess }) => {
  const navigate = useNavigate();
  const [payingBill, setPayingBill] = useState(null);
  const [expanded, setExpanded] = useState(true);
  const [openActionId, setOpenActionId] = useState(null);
  const actionRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (actionRef.current && !actionRef.current.contains(e.target)) {
        setOpenActionId(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Group & sort bills by status
  const grouped = bills.reduce((acc, bill) => {
    const status = bill.due_status || 'upcoming';
    if (!acc[status]) acc[status] = [];
    acc[status].push(bill);
    return acc;
  }, {});

  const sortedGroups = STATUS_ORDER.filter((s) => grouped[s]?.length).map((status) => ({
    status,
    config: STATUS_CONFIG[status],
    bills: grouped[status],
  }));

  const totalUnpaid = bills
    .filter((b) => b.due_status !== 'paid')
    .reduce((sum, b) => sum + parseFloat(b.amount || 0), 0);
  const overdueCount = grouped.overdue?.length || 0;
  const dueSoonCount = grouped.due_soon?.length || 0;
  const paidCount = grouped.paid?.length || 0;

  // Empty state
  if (!bills.length) {
    return (
      <div className="brutal-card animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-extrabold text-navy">🔔 Tagihan Mendatang</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <span className="text-4xl mb-3">🔕</span>
          <p className="text-sm font-bold text-navy/50">Tidak ada tagihan aktif</p>
          <p className="mt-1 text-xs text-navy/30">Tambahkan tagihan rutin di halaman Tagihan</p>
          <button
            onClick={() => navigate('/bills')}
            className="btn-brutal-secondary mt-4 text-xs"
          >
            <HiOutlineChevronRight className="w-3 h-3" /> Ke Halaman Tagihan
          </button>
        </div>
      </div>
    );
  }

  // Urgency banner
  const hasUrgent = overdueCount > 0 || dueSoonCount > 0;

  return (
    <div className="brutal-card animate-slide-up p-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔔</span>
          <h3 className="text-lg font-extrabold text-navy">Tagihan</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/bills')}
            className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors px-2 py-1.5 rounded-brutal border-2 border-transparent hover:border-primary/30 hover:bg-primary/5"
          >
            Semua <HiOutlineChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Urgency Banner */}
      {hasUrgent && (
        <div className={`mx-5 mb-3 flex items-center gap-3 rounded-brutal border-3 p-3 ${
          overdueCount > 0 ? 'border-expense bg-expense/10' : 'border-warning bg-warning/10'
        }`}>
          <HiOutlineExclamation className={`w-5 h-5 shrink-0 ${overdueCount > 0 ? 'text-expense' : 'text-warning'}`} />
          <p className="text-xs font-bold text-navy leading-relaxed">
            {overdueCount > 0
              ? `${overdueCount} tagihan terlambat bayar! Bayar sekarang agar tidak menumpuk.`
              : `${dueSoonCount} tagihan jatuh tempo dalam 3 hari. Siapkan dananya!`}
          </p>
        </div>
      )}

      {/* Summary Bar */}
      <div className="mx-5 mb-3 flex items-center gap-3 text-xs font-bold">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-brutal border-2 border-navy bg-cream">
          <HiOutlineCash className="w-3.5 h-3.5 text-navy/50" />
          <span className="text-navy">Total belum bayar: <span className="text-expense">{formatRp(totalUnpaid)}</span></span>
        </div>
        {paidCount > 0 && (
          <div className="px-2.5 py-1.5 rounded-brutal border-2 border-income bg-income/10 text-income">
            ✅ {paidCount} lunas
          </div>
        )}
      </div>

      {/* Bill Groups */}
      <div className={`transition-all duration-300 ${expanded ? '' : 'max-h-0 overflow-hidden'}`}>
        {sortedGroups.map(({ status, config, bills: groupBills }) => (
          <div key={status} className={`${config.cardBg} border-t-3 ${config.cardBorder} first:border-t-0`}>
            {/* Group header */}
            <button
              onClick={() => setExpanded((prev) => !prev)}
              className="flex w-full items-center justify-between px-5 py-2.5 text-left hover:bg-black/[0.02] transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{config.emoji}</span>
                <span className="text-xs font-extrabold uppercase tracking-wider text-navy/60">
                  {config.label}
                </span>
              </div>
              <span className="text-xs font-bold text-navy/40">{groupBills.length}</span>
            </button>

            {/* Bill Items */}
            <div className="px-5 pb-3 space-y-2">
              {groupBills.map((bill) => {
                const isPaid = status === 'paid';
                const billConfig = STATUS_CONFIG[status];
                const isOpen = openActionId === bill.id;

                return (
                  <div
                    key={bill.id}
                    className={`relative flex items-center gap-3 p-3 rounded-brutal border-2 bg-white border-navy/10 transition-all ${
                      isOpen ? 'z-20 border-navy shadow-brutal-sm' : 'hover:border-navy/30 hover:shadow-brutal-sm'
                    } ${isPaid ? 'opacity-50' : ''}`}
                  >
                    {/* Day badge */}
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-brutal border-2 border-navy text-sm font-extrabold ${
                        isPaid ? 'bg-income/20 text-income' : status === 'overdue' ? 'bg-expense/20 text-expense' : 'bg-warning/20 text-navy'
                      }`}
                    >
                      {bill.due_day}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-bold text-navy truncate ${isPaid ? 'line-through' : ''}`}>
                        {bill.name}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] font-medium text-navy/40">
                        <span>Tgl {bill.due_day}/bulan</span>
                        {bill.category_icon && bill.category_name && (
                          <>
                            <span>•</span>
                            <span>{bill.category_icon} {bill.category_name}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Amount + Action */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-sm font-extrabold ${isPaid ? 'text-navy/30 line-through' : 'text-navy'}`}>
                        {formatRp(bill.amount)}
                      </span>

                      {/* Pay button */}
                      {!isPaid && (
                        <button
                          onClick={() => setPayingBill(bill)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-brutal border-2 border-navy text-[11px] font-bold bg-income text-navy hover:-translate-y-0.5 hover:shadow-brutal-sm transition-all"
                          title="Bayar tagihan ini"
                        >
                          💰 Bayar
                        </button>
                      )}

                      {isPaid && (
                        <span className={`text-[10px] px-2 py-1 rounded-full border-2 font-bold ${billConfig.badgeCls}`}>
                          {billConfig.emoji} Lunas
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer link */}
      <div className="border-t-3 border-navy/10 px-5 py-3">
        <button
          onClick={() => navigate('/bills')}
          className="flex w-full items-center justify-center gap-2 text-sm font-bold text-navy/50 hover:text-navy transition-colors py-1.5 rounded-brutal border-2 border-transparent hover:border-navy/20 hover:bg-cream"
        >
          Kelola semua tagihan <HiOutlineChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* PayBillModal */}
      <PayBillModal
        isOpen={Boolean(payingBill)}
        bill={payingBill}
        onClose={() => setPayingBill(null)}
        onSuccess={() => {
          setPayingBill(null);
          onPaySuccess?.();
        }}
      />
    </div>
  );
};

export default UpcomingBills;