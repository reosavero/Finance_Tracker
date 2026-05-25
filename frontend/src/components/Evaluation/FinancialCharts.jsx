import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, Legend
} from 'recharts';

const CATEGORY_COLORS = ['#4361EE', '#06D6A0', '#EF476F', '#FFD60A', '#F77F00', '#7B2CBF', '#118AB2', '#E63946', '#2A9D8F', '#F4A261'];

const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

// Custom tooltip
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border-2 border-navy rounded-brutal px-3 py-2 shadow-brutal-sm text-xs">
        {payload.map((p, i) => (
          <p key={i} className="font-bold" style={{ color: p.color }}>
            {p.name}: {typeof p.value === 'number' && !p.name.includes('Bulan') ? formatRp(p.value) : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 1.4;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central"
      className="text-[10px] font-bold fill-navy">
      {name} ({(percent * 100).toFixed(0)}%)
    </text>
  );
};

const FinancialCharts = ({ categoryBreakdown = [], trend = [], summary }) => {
  // Pie chart data
  const pieData = categoryBreakdown.map((c) => ({
    name: c.name,
    value: parseFloat(c.total),
    icon: c.icon,
  }));

  // Bar chart: income vs expense per month
  const monthLabels = { '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'Mei', '06': 'Jun', '07': 'Jul', '08': 'Agu', '09': 'Sep', '10': 'Okt', '11': 'Nov', '12': 'Des' };
  const barData = trend.map((t) => {
    const [y, m] = t.month.split('-');
    return {
      month: monthLabels[m] || m,
      Pemasukan: parseFloat(t.income),
      Pengeluaran: parseFloat(t.expense),
    };
  });

  // Area chart: net cashflow trend
  const areaData = trend.map((t) => {
    const [y, m] = t.month.split('-');
    return {
      month: monthLabels[m] || m,
      Net: parseFloat(t.income) - parseFloat(t.expense),
    };
  });

  const hasCategoryData = pieData.length > 0;
  const hasTrendData = barData.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pie Chart: Category Breakdown */}
      <div className="brutal-card animate-slide-up">
        <h3 className="text-base font-bold text-navy mb-4">🍩 Pengeluaran per Kategori</h3>
        {hasCategoryData ? (
          <>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={45}
                    paddingAngle={3}
                    dataKey="value"
                    label={PieLabel}
                    labelLine={false}
                    animationBegin={200}
                    animationDuration={800}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} stroke="#1A1A2E" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend cards */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              {categoryBreakdown.slice(0, 6).map((c, i) => (
                <div key={c.id} className="flex items-center gap-2 px-2 py-1.5 rounded-brutal border-2 border-navy/5 bg-cream/30">
                  <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                  <span className="text-[11px] font-bold text-navy truncate flex-1">{c.name}</span>
                  <span className="text-[10px] font-bold text-navy/40 shrink-0">{Math.round(parseFloat(c.total) / summary.total_expense * 100)}%</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-center text-navy/30 font-medium py-12 text-sm">Belum ada data pengeluaran</p>
        )}
      </div>

      {/* Bar Chart: Income vs Expense */}
      <div className="brutal-card animate-slide-up">
        <h3 className="text-base font-bold text-navy mb-4">📈 Income vs Expense</h3>
        {hasTrendData ? (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DE" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 700 }} stroke="#1A1A2E" />
                <YAxis tick={{ fontSize: 10 }} stroke="#1A1A2E" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                <Bar dataKey="Pemasukan" fill="#06D6A0" radius={[6, 6, 0, 0]} animationDuration={800} />
                <Bar dataKey="Pengeluaran" fill="#EF476F" radius={[6, 6, 0, 0]} animationDuration={800} animationBegin={300} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-center text-navy/30 font-medium py-12 text-sm">Belum cukup data untuk trend</p>
        )}
      </div>

      {/* Area Chart: Net Cashflow Trend */}
      {hasTrendData && (
        <div className="brutal-card animate-slide-up lg:col-span-2">
          <h3 className="text-base font-bold text-navy mb-4">📉 Tren Cashflow Bersih</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4361EE" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4361EE" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DE" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 700 }} stroke="#1A1A2E" />
                <YAxis tick={{ fontSize: 10 }} stroke="#1A1A2E" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Net" stroke="#4361EE" strokeWidth={3} fill="url(#netGradient)" animationDuration={1000} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialCharts;