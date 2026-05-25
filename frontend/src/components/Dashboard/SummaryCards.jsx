import {
  HiOutlineArrowTrendingDown,
  HiOutlineArrowTrendingUp,
  HiOutlineBanknotes,
} from 'react-icons/hi2';

const formatRp = (n) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(Number(n) || 0));

const SummaryCards = ({ data, refreshing = false }) => {
  const monthlyAllowance = Number(data?.monthly_allowance) || 0;
  const totalIncome = Number(data?.total_income) || 0;
  const totalExpense = Number(data?.total_expense) || 0;

  // Hitung balance di frontend dari field yang sudah pasti update
  // Formula: Uang Bulanan + Pemasukan - Pengeluaran
  const balance = monthlyAllowance + totalIncome - totalExpense;
  const totalIncomingFunds = monthlyAllowance + totalIncome;

  const cards = [
    {
      label: 'Sisa Saldo',
      value: formatRp(balance),
      icon: HiOutlineBanknotes,
      bg: 'bg-secondary',
      sub: 'Saldo tersedia bulan ini',
      detail: `Masuk ${formatRp(totalIncomingFunds)} • Keluar ${formatRp(totalExpense)}`,
      status: balance < 0 ? 'Defisit' : balance === 0 ? 'Netral' : 'Aman',
      iconWrap: 'bg-white/60',
      textColor: 'text-navy',
      highlight: true,
      valueColor: balance < 0 ? 'text-expense' : 'text-navy',
    },
    {
      label: 'Pemasukan',
      value: formatRp(totalIncomingFunds),
      icon: HiOutlineArrowTrendingUp,
      bg: 'bg-income',
      sub: 'Total pemasukan bulan ini',
      detail: `Uang saku ${formatRp(monthlyAllowance)} • Transaksi masuk ${formatRp(totalIncome)}`,
      iconWrap: 'bg-white/40',
      textColor: 'text-navy',
      highlight: true,
      valueColor: 'text-navy',
    },
    {
      label: 'Pengeluaran',
      value: formatRp(totalExpense),
      icon: HiOutlineArrowTrendingDown,
      bg: 'bg-expense',
      sub: 'Total pengeluaran bulan ini',
      detail: balance < 0 ? 'Pengeluaran melebihi pemasukan' : 'Pengeluaran masih terkendali',
      iconWrap: 'bg-white/15',
      textColor: 'text-white',
      valueColor: 'text-white',
    },
  ];

  return (
    <div className="relative">
      {refreshing && (
        <div className="absolute top-0 left-0 right-0 z-10 flex justify-center -mt-1">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border-3 border-primary shadow-brutal-sm">
            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold text-primary">Memperbarui...</span>
          </div>
        </div>
      )}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 transition-opacity duration-300 ${refreshing ? 'opacity-70' : 'opacity-100'}`}>
        {cards.map((card, i) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className={[
                card.bg,
                card.textColor,
                'border-3 border-navy rounded-brutal-lg shadow-brutal-lg p-5 min-h-[168px] flex flex-col justify-between transition-all duration-200 hover:-translate-y-1',
                card.highlight ? 'ring-2 ring-navy/10' : '',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <span className="text-xs md:text-sm font-extrabold uppercase tracking-[0.18em] opacity-70 block">
                    {card.label}
                  </span>
                  <p className="text-xs font-medium mt-1 opacity-75">{card.sub}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {card.status && (
                    <span className="hidden md:inline-flex px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider border-2 border-navy rounded-full bg-white/60">
                      {card.status}
                    </span>
                  )}
                  <div className={`shrink-0 p-3 rounded-brutal border-2 border-navy ${card.iconWrap}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div>
                <p className={`text-2xl md:text-3xl font-black leading-tight break-words ${card.valueColor || ''}`}>
                  {card.value}
                </p>
                <p className="text-xs md:text-sm font-semibold mt-3 opacity-80 leading-relaxed">
                  {card.detail}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SummaryCards;