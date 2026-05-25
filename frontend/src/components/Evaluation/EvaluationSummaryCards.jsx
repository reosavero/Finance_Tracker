const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const EvaluationSummaryCards = ({ summary, monthComparison, billStatus }) => {
  const hasNoData = summary.total_income === 0 && summary.total_expense === 0;

  const cards = [
    {
      label: 'Duit Masuk',
      desc: hasNoData ? 'Belum ada pemasukan' : `Uang saku ${formatRp(summary.monthly_allowance)} + pemasukan ${formatRp(summary.total_income)}`,
      value: summary.total_capacity,
      icon: '📈',
      color: 'border-income/40 bg-income/5',
      accent: 'text-income',
      badge: !hasNoData && monthComparison?.income_change != null
        ? `${monthComparison.income_change >= 0 ? '+' : ''}${monthComparison.income_change}% vs bln lalu`
        : null,
      badgeColor: monthComparison?.income_change >= 0 ? 'text-income' : 'text-expense',
    },
    {
      label: 'Duit Keluar',
      desc: hasNoData ? 'Belum ada pengeluaran' : 'Total pengeluaran bulan ini',
      value: summary.total_expense,
      icon: '💸',
      color: 'border-expense/40 bg-expense/5',
      accent: 'text-expense',
      badge: !hasNoData && monthComparison?.expense_change != null
        ? `${monthComparison.expense_change >= 0 ? '+' : ''}${monthComparison.expense_change}% vs bln lalu`
        : null,
      badgeColor: monthComparison?.expense_change > 0 ? 'text-expense' : 'text-income',
    },
    {
      label: 'Sisa Uang',
      desc: hasNoData ? 'Mulai catat transaksi untuk lihat sisa uang' : (summary.balance >= 0 ? 'Masih ada sisa 👍' : 'Defisit! Uang kurang ⚠️'),
      value: summary.balance,
      icon: summary.balance >= 0 ? '💎' : '🚨',
      color: hasNoData ? 'border-navy/15 bg-cream/50' : summary.balance >= 0 ? 'border-primary/40 bg-primary/5' : 'border-expense/40 bg-expense/5',
      accent: hasNoData ? 'text-navy/30' : summary.balance >= 0 ? 'text-primary' : 'text-expense',
      badge: null,
      badgeColor: '',
    },
    {
      label: 'Tabungan',
      desc: hasNoData ? 'Belum ada data tabungan' : `${Math.round(summary.saving_ratio * 100)}% duit masuk yang tersisa`,
      value: hasNoData ? '—' : `${Math.round(summary.saving_ratio * 100)}%`,
      icon: hasNoData ? '🏦' : summary.saving_ratio >= 0.2 ? '🏦' : summary.saving_ratio >= 0 ? '⚠️' : '🚨',
      color: hasNoData ? 'border-navy/15 bg-cream/50' : summary.saving_ratio >= 0.2 ? 'border-income/40 bg-income/5' : summary.saving_ratio >= 0 ? 'border-warning/40 bg-warning/5' : 'border-expense/40 bg-expense/5',
      accent: hasNoData ? 'text-navy/30' : summary.saving_ratio >= 0.2 ? 'text-income' : summary.saving_ratio >= 0 ? 'text-warning' : 'text-expense',
      badge: hasNoData ? null : summary.saving_ratio >= 0.2 ? 'Ideal ≥20%' : summary.saving_ratio >= 0 ? 'Kurang' : 'Negatif!',
      badgeColor: hasNoData ? '' : summary.saving_ratio >= 0.2 ? 'text-income' : summary.saving_ratio >= 0 ? 'text-warning' : 'text-expense',
    },
    {
      label: 'Arus Uang',
      desc: hasNoData ? 'Belum ada data arus uang' : (summary.cashflow_percent >= 0 ? 'Masih tersisa dari duit masuk' : 'Duit keluar lebih banyak dari masuk'),
      value: hasNoData ? '—' : `${summary.cashflow_percent >= 0 ? '+' : ''}${summary.cashflow_percent}%`,
      icon: hasNoData ? '💹' : summary.cashflow_percent >= 0 ? '💹' : '🔻',
      color: hasNoData ? 'border-navy/15 bg-cream/50' : summary.cashflow_percent >= 0 ? 'border-income/40 bg-income/5' : 'border-expense/40 bg-expense/5',
      accent: hasNoData ? 'text-navy/30' : summary.cashflow_percent >= 0 ? 'text-income' : 'text-expense',
      badge: null,
      badgeColor: '',
    },
    {
      label: 'Tagihan',
      desc: hasNoData || !billStatus || billStatus.total === 0 ? 'Belum ada tagihan aktif' : (billStatus.status === 'all_paid' ? 'Semua tagihan lunas' : `Masih ${billStatus.total - billStatus.paid} tagihan belum dibayar`),
      value: !billStatus || billStatus.total === 0 ? '—' : `${billStatus.paid}/${billStatus.total}`,
      icon: !billStatus || billStatus.total === 0 ? '📋' : billStatus.status === 'all_paid' ? '✅' : '📋',
      color: !billStatus || billStatus.total === 0 ? 'border-navy/15 bg-cream/50' : billStatus.status === 'all_paid' ? 'border-income/40 bg-income/5' : 'border-warning/40 bg-warning/5',
      accent: !billStatus || billStatus.total === 0 ? 'text-navy/30' : billStatus.status === 'all_paid' ? 'text-income' : 'text-warning',
      badge: !billStatus || billStatus.total === 0 ? null : billStatus.status === 'all_paid' ? 'Lunas ✅' : `${billStatus.total - billStatus.paid} belum bayar`,
      badgeColor: !billStatus || billStatus.total === 0 ? '' : billStatus.status === 'all_paid' ? 'text-income' : 'text-warning',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div key={card.label} className={`brutal-card-sm border-2 ${card.color} animate-slide-up`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xl">{card.icon}</span>
            {card.badge && (
              <span className={`text-[10px] font-bold ${card.badgeColor}`}>
                {card.badge}
              </span>
            )}
          </div>
          <p className="text-xs font-bold text-navy">{card.label}</p>
          <p className={`text-xl font-bold ${card.accent} mt-0.5`}>
            {typeof card.value === 'number' ? formatRp(card.value) : card.value}
          </p>
          <p className="text-[10px] text-navy/35 font-medium mt-1 leading-tight">{card.desc}</p>
        </div>
      ))}
    </div>
  );
};

export default EvaluationSummaryCards;