import { HiOutlineLightningBolt, HiOutlineTrendingUp } from 'react-icons/hi';

const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const INSIGHT_STYLES = {
  positive: { bg: 'bg-income/5', border: 'border-income/30', dot: 'bg-income' },
  warning: { bg: 'bg-warning/5', border: 'border-warning/30', dot: 'bg-warning' },
  danger:  { bg: 'bg-expense/5', border: 'border-expense/30', dot: 'bg-expense' },
  info:    { bg: 'bg-primary/5', border: 'border-primary/30', dot: 'bg-primary' },
};

const SpendingInsightCard = ({ spendingAnalysis, insights }) => {
  const { top_category, biggest_transactions, frequent_categories, small_transaction_count, category_breakdown } = spendingAnalysis;

  return (
    <div className="brutal-card animate-slide-up">
      <div className="flex items-center gap-2 mb-4">
        <HiOutlineLightningBolt className="w-5 h-5 text-warning" />
        <h3 className="text-lg font-bold text-navy">Analisis Pengeluaran</h3>
      </div>

      {/* Top Category */}
      {top_category && (
        <div className="border-2 border-navy/10 rounded-brutal p-4 mb-4 bg-cream/30">
          <p className="text-xs font-bold text-navy/50 uppercase tracking-wider mb-2">Kategori Paling Boros</p>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-brutal border-2 border-navy flex items-center justify-center text-xl shrink-0"
              style={{ backgroundColor: `${top_category.color}20` }}>
              {top_category.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-navy">{top_category.name}</p>
              <p className="text-xs text-navy/40 font-medium">
                {top_category.count} transaksi • {formatRp(parseFloat(top_category.total))}
              </p>
            </div>
            {category_breakdown.length > 0 && (
              <span className="text-sm font-bold text-expense">
                {Math.round(parseFloat(top_category.total) / category_breakdown.reduce((s, c) => s + parseFloat(c.total), 0) * 100)}%
              </span>
            )}
          </div>
        </div>
      )}

      {/* Biggest Transactions */}
      {biggest_transactions.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-bold text-navy/50 uppercase tracking-wider mb-2">Transaksi Terbesar</p>
          <div className="space-y-1.5">
            {biggest_transactions.slice(0, 3).map((t, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-brutal border-2 border-transparent hover:border-navy hover:bg-cream transition-all">
                <span className="w-6 h-6 rounded-full border-2 border-navy bg-expense/10 text-expense text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-navy truncate">{t.description || t.category_name}</p>
                  <p className="text-[11px] text-navy/40">{t.category_name} • {new Date(t.transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                </div>
                <span className="text-sm font-bold text-expense shrink-0">-{formatRp(t.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Frequent Categories */}
      {frequent_categories.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-bold text-navy/50 uppercase tracking-wider mb-2">Paling Sering Dibelanjakan</p>
          <div className="space-y-1.5">
            {frequent_categories.slice(0, 3).map((c, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">{c.icon}</span>
                  <span className="text-sm font-bold text-navy">{c.name}</span>
                </div>
                <span className="text-xs font-bold text-navy/50">{c.tx_count}x</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="border-t-2 border-navy/10 pt-4 mt-4">
        <div className="flex items-center gap-2 mb-3">
          <HiOutlineTrendingUp className="w-4 h-4 text-primary" />
          <p className="text-xs font-bold text-navy/50 uppercase tracking-wider">AI Insights</p>
        </div>
        <div className="space-y-2">
          {insights.map((insight, i) => {
            const style = INSIGHT_STYLES[insight.type] || INSIGHT_STYLES.info;
            return (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-brutal border-2 ${style.border} ${style.bg}`}>
                <span className="text-lg shrink-0">{insight.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-navy">{insight.title}</p>
                  <p className="text-xs text-navy/50 font-medium mt-0.5 leading-relaxed">{insight.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SpendingInsightCard;