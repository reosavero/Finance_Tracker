const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const RecentTransactions = ({ transactions = [] }) => {
  if (!transactions.length) {
    return (
      <div className="brutal-card animate-slide-up">
        <h3 className="text-lg font-bold text-navy mb-4">🕐 Transaksi Terakhir</h3>
        <p className="text-center text-navy/30 font-medium py-8">Belum ada transaksi</p>
      </div>
    );
  }

  return (
    <div className="brutal-card animate-slide-up">
      <h3 className="text-lg font-bold text-navy mb-4">🕐 Transaksi Terakhir</h3>
      <div className="space-y-2">
        {transactions.map((t, i) => (
          <div key={t.id || i}
            className="flex items-center gap-3 px-3 py-3 rounded-brutal border-2 border-transparent hover:border-navy hover:bg-cream transition-all">
            <div className="w-10 h-10 rounded-brutal border-2 border-navy flex items-center justify-center text-lg"
              style={{ backgroundColor: `${t.category_color}30` }}>
              {t.category_icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-navy truncate">
                {t.description || t.category_name}
              </p>
              <p className="text-xs font-medium text-navy/40">
                {t.category_name} • {new Date(t.transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
              </p>
            </div>
            <span className={`text-sm font-bold px-2 py-1 rounded-brutal border-2 border-navy ${
              t.type === 'income' ? 'bg-income text-navy' : 'bg-expense/10 text-expense'
            }`}>
              {t.type === 'income' ? '+' : '-'}{formatRp(t.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentTransactions;
