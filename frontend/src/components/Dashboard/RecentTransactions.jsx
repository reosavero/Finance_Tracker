import { useNavigate } from 'react-router-dom';

const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const MAX_VISIBLE = 5;

const RecentTransactions = ({ transactions = [] }) => {
  const navigate = useNavigate();

  if (!transactions.length) {
    return (
      <div className="brutal-card animate-slide-up">
        <h3 className="text-lg font-bold text-navy mb-4">🕐 Transaksi Terakhir</h3>
        <p className="text-center text-navy/30 font-medium py-8">Belum ada transaksi</p>
      </div>
    );
  }

  const visible = transactions.slice(0, MAX_VISIBLE);

  return (
    <div className="brutal-card animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-navy">🕐 Transaksi Terakhir</h3>
        {transactions.length > MAX_VISIBLE && (
          <button
            onClick={() => navigate('/transactions')}
            className="text-xs font-bold text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded-brutal border-2 border-transparent hover:border-primary/30 hover:bg-primary/5"
          >
            Lihat semua →
          </button>
        )}
      </div>
      <div className="space-y-1.5">
        {visible.map((t, i) => (
          <div key={t.id || i}
            className="flex items-center gap-3 px-3 py-2.5 rounded-brutal border-2 border-transparent hover:border-navy hover:bg-cream transition-all">
            <div className="w-9 h-9 rounded-brutal border-2 border-navy flex items-center justify-center text-base shrink-0"
              style={{ backgroundColor: `${t.category_color}30` }}>
              {t.category_icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-navy truncate">
                {t.description || t.category_name}
              </p>
              <p className="text-[11px] font-medium text-navy/40">
                {t.category_name} • {new Date(t.transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
              </p>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-brutal border-2 border-navy shrink-0 ${
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