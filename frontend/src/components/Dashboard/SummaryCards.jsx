import { HiOutlineArrowUp, HiOutlineArrowDown, HiOutlineCash } from 'react-icons/hi';

const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const SummaryCards = ({ data }) => {
  const cards = [
    {
      label: 'Sisa Saldo',
      value: formatRp(data?.balance || 0),
      icon: '💰',
      bg: 'bg-secondary',
      sub: 'Bulan ini',
    },
    {
      label: 'Pemasukan',
      value: formatRp((data?.monthly_allowance || 0) + (data?.total_income || 0)),
      icon: '📈',
      bg: 'bg-income',
      sub: `Uang saku: ${formatRp(data?.monthly_allowance || 0)}`,
    },
    {
      label: 'Pengeluaran',
      value: formatRp(data?.total_expense || 0),
      icon: '📉',
      bg: 'bg-expense',
      sub: 'Total bulan ini',
      textWhite: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card, i) => (
        <div key={i}
          className={`${card.bg} ${card.textWhite ? 'text-white' : 'text-navy'} border-3 border-navy rounded-brutal-lg shadow-brutal-lg p-5 animate-slide-up`}
          style={{ animationDelay: `${i * 100}ms` }}>
          <div className="flex items-start justify-between mb-3">
            <span className="text-sm font-bold uppercase tracking-wide opacity-80">{card.label}</span>
            <span className="text-2xl">{card.icon}</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold">{card.value}</p>
          <p className="text-xs font-medium mt-1 opacity-60">{card.sub}</p>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;
