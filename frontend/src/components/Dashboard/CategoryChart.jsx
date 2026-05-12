import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="brutal-card-sm text-sm">
      <p className="font-bold text-navy">{d.name}</p>
      <p className="text-navy/60">{formatRp(d.value)}</p>
    </div>
  );
};

const CategoryChart = ({ data = [] }) => {
  if (!data.length) {
    return (
      <div className="brutal-card animate-slide-up">
        <h3 className="text-lg font-bold text-navy mb-4">📊 Pengeluaran per Kategori</h3>
        <div className="flex items-center justify-center h-48 text-navy/30 font-medium">
          Belum ada data pengeluaran bulan ini
        </div>
      </div>
    );
  }

  const total = data.reduce((s, d) => s + parseFloat(d.total), 0);
  const chartData = data.map((d) => ({ name: d.name, value: parseFloat(d.total), icon: d.icon, color: d.color }));

  return (
    <div className="brutal-card animate-slide-up">
      <h3 className="text-lg font-bold text-navy mb-4">📊 Pengeluaran per Kategori</h3>
      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* Chart */}
        <div className="w-48 h-48 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                dataKey="value" strokeWidth={3} stroke="#1A1A2E" paddingAngle={2}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Legend */}
        <div className="flex-1 w-full space-y-2">
          {chartData.map((d, i) => {
            const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : 0;
            return (
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-brutal border-2 border-transparent hover:border-navy hover:bg-cream transition-all">
                <span className="text-lg">{d.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-navy truncate">{d.name}</span>
                    <span className="text-xs font-bold bg-cream px-2 py-0.5 rounded-full border-2 border-navy">{pct}%</span>
                  </div>
                  <div className="h-3 bg-cream border-2 border-navy rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: d.color }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoryChart;
