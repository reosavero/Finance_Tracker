const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const statusConfig = {
  overdue: { label: '🔴 Terlambat', cls: 'bg-expense text-white border-navy' },
  due_soon: { label: '🟡 Segera', cls: 'bg-warning text-navy border-navy' },
  upcoming: { label: '⏳ Mendatang', cls: 'bg-cream text-navy/50 border-navy' },
  paid: { label: '✅ Lunas', cls: 'bg-income text-navy border-navy' },
};

const UpcomingBills = ({ bills = [] }) => {
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
          return (
            <div key={bill.id || i}
              className="flex items-center gap-3 px-3 py-3 rounded-brutal border-2 border-transparent hover:border-navy hover:bg-cream transition-all">
              <div className="w-10 h-10 rounded-brutal border-2 border-navy bg-warning/20 flex items-center justify-center text-navy font-bold text-sm">
                {bill.due_day}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-navy truncate">{bill.name}</p>
                <p className="text-xs font-medium text-navy/40">Tgl {bill.due_day} tiap bulan</p>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <span className="text-sm font-bold text-navy">{formatRp(bill.amount)}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border-2 font-bold ${st.cls}`}>
                  {st.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UpcomingBills;
