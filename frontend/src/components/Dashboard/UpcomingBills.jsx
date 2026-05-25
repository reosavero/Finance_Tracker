import { useState } from 'react';
import PayBillModal from '../Bills/PayBillModal';
import { HiOutlineBanknotes } from 'react-icons/hi2';

const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const statusConfig = {
  overdue: { label: '🔴 Terlambat', cls: 'bg-expense text-white border-navy' },
  due_soon: { label: '🟡 Segera', cls: 'bg-warning text-navy border-navy' },
  upcoming: { label: '⏳ Mendatang', cls: 'bg-cream text-navy/50 border-navy' },
  paid: { label: '✅ Lunas', cls: 'bg-income text-navy border-navy' },
};

const UpcomingBills = ({ bills = [], onPaySuccess }) => {
  const [payingBill, setPayingBill] = useState(null);

  if (!bills.length) {
    return (
      <div className="brutal-card animate-slide-up">
        <h3 className="text-lg font-bold text-navy mb-4">🔔 Tagihan Mendatang</h3>
        <p className="text-center text-navy/30 font-medium py-8">Tidak ada tagihan aktif</p>
      </div>
    );
  }

  return (
    <div className="brutal-card animate-slide-up">
      <h3 className="text-lg font-bold text-navy mb-4">🔔 Tagihan Mendatang</h3>
      <div className="space-y-2">
        {bills.map((bill, i) => {
          const st = statusConfig[bill.due_status] || statusConfig.upcoming;
          const isPaid = bill.due_status === 'paid';
          return (
            <div key={bill.id || i}
              className={`flex items-center gap-3 px-3 py-3 rounded-brutal border-2 border-transparent hover:border-navy hover:bg-cream transition-all ${isPaid ? 'opacity-60' : ''}`}>
              <div className="w-10 h-10 rounded-brutal border-2 border-navy bg-warning/20 flex items-center justify-center text-navy font-bold text-sm">
                {bill.due_day}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold text-navy truncate ${isPaid ? 'line-through' : ''}`}>{bill.name}</p>
                <p className="text-xs font-medium text-navy/40">Tgl {bill.due_day} tiap bulan</p>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <span className={`text-sm font-bold ${isPaid ? 'text-navy/40 line-through' : 'text-navy'}`}>{formatRp(bill.amount)}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border-2 font-bold ${st.cls}`}>
                  {st.label}
                </span>
              </div>
              {/* Tombol Bayar langsung dari Dashboard */}
              {!isPaid && (
                <button
                  onClick={() => setPayingBill(bill)}
                  className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-brutal border-2 border-navy text-[11px] font-bold bg-income text-navy hover:-translate-y-0.5 hover:shadow-brutal-sm transition-all"
                  title="Bayar tagihan ini"
                >
                  <HiOutlineBanknotes className="w-3.5 h-3.5" /> Bayar
                </button>
              )}
              {isPaid && (
                <span className="shrink-0 text-[11px] font-bold text-income">✅</span>
              )}
            </div>
          );
        })}
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
