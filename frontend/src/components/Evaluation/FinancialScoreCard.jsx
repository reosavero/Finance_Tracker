const FinancialScoreCard = ({ score, summary, billStatus }) => {
  const { score: scoreValue, category, color, emoji } = score;

  // Deteksi apakah belum ada data transaksi
  const hasNoData = summary.total_income === 0 && summary.total_expense === 0;

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = hasNoData ? circumference : circumference - (scoreValue / 100) * circumference;

  // Jika belum ada data, jangan tampilkan faktor yang menyesatkan
  const getFactorValues = () => {
    if (hasNoData) {
      return [
        { label: 'Tabungan', pct: 0, color: '#E8E4DE', desc: 'Belum ada data' },
        { label: 'Pengeluaran', pct: 0, color: '#E8E4DE', desc: 'Belum ada data' },
        { label: 'Tagihan', pct: 0, color: '#E8E4DE', desc: 'Belum ada data' },
        { label: 'Kebiasaan', pct: 0, color: '#E8E4DE', desc: 'Belum ada data' },
      ];
    }

    // ---- Tabungan ----
    let savingPct, savingLabel;
    if (summary.total_income === 0 && summary.total_expense > 0) {
      // Ada expense tapi tidak ada income → defisit
      savingPct = 0;
      savingLabel = 'Defisit';
    } else if (summary.saving_ratio >= 0.2) {
      savingPct = 100;
      savingLabel = 'Baik';
    } else if (summary.saving_ratio >= 0.1) {
      savingPct = 60;
      savingLabel = 'Cukup';
    } else if (summary.saving_ratio >= 0) {
      savingPct = 30;
      savingLabel = 'Kurang';
    } else {
      savingPct = 0;
      savingLabel = 'Defisit';
    }

    // ---- Pengeluaran ----
    let budgetPct, budgetLabel;
    const eoa = summary.expense_over_allowance;
    if (eoa <= 0) {
      // expense = 0, belum belanja
      budgetPct = 0;
      budgetLabel = 'Belum ada data';
    } else if (eoa <= 0.5) {
      budgetPct = 100;
      budgetLabel = 'Terkontrol';
    } else if (eoa <= 0.8) {
      budgetPct = 80;
      budgetLabel = 'Hampir Batas';
    } else if (eoa <= 1) {
      budgetPct = 50;
      budgetLabel = 'Hampir Penuh';
    } else {
      budgetPct = 20;
      budgetLabel = 'Over Budget';
    }

    // ---- Tagihan ----
    let billPct, billLabel;
    if (!billStatus || billStatus.total === 0) {
      billPct = 0;
      billLabel = 'Belum ada';
    } else if (billStatus.status === 'all_paid') {
      billPct = 100;
      billLabel = 'Lunas ✅';
    } else if (billStatus.paid / billStatus.total >= 0.5) {
      billPct = 60;
      billLabel = 'Sebagian';
    } else {
      billPct = 20;
      billLabel = 'Belum Bayar';
    }

    // ---- Kebiasaan ----
    let habitPct, habitLabel;
    if (summary.total_expense === 0) {
      habitPct = 0;
      habitLabel = 'Belum ada data';
    } else if (scoreValue >= 70) {
      habitPct = 100;
      habitLabel = 'Sehat';
    } else if (scoreValue >= 50) {
      habitPct = 60;
      habitLabel = 'Cukup';
    } else {
      habitPct = 30;
      habitLabel = 'Perlu Diperbaiki';
    }

    return [
      { label: 'Tabungan', pct: savingPct, color: savingPct >= 80 ? '#06D6A0' : savingPct >= 40 ? '#F77F00' : savingPct === 0 ? '#E8E4DE' : '#EF476F', desc: savingLabel },
      { label: 'Pengeluaran', pct: budgetPct, color: budgetPct >= 80 ? '#06D6A0' : budgetPct >= 40 ? '#F77F00' : budgetPct === 0 ? '#E8E4DE' : '#EF476F', desc: budgetLabel },
      { label: 'Tagihan', pct: billPct, color: billPct >= 80 ? '#06D6A0' : billPct >= 40 ? '#F77F00' : billPct === 0 ? '#E8E4DE' : '#EF476F', desc: billLabel },
      { label: 'Kebiasaan', pct: habitPct, color: habitPct >= 80 ? '#06D6A0' : habitPct >= 40 ? '#F77F00' : habitPct === 0 ? '#E8E4DE' : '#EF476F', desc: habitLabel },
    ];
  };

  const factors = getFactorValues();

  const getDescription = () => {
    if (hasNoData) return 'Mulai catat transaksimu untuk melihat skor keuangan.';
    if (scoreValue >= 80) return 'Keuanganmu sangat sehat! 🎉';
    if (scoreValue >= 60) return 'Cukup baik, masih bisa ditingkatkan.';
    if (scoreValue >= 40) return 'Perlu perhatian — pengeluaran terlalu tinggi.';
    return 'Krisis! Segera kurangi pengeluaranmu.';
  };

  return (
    <div className="brutal-card animate-slide-up">
      <h3 className="text-sm font-bold text-navy/60 uppercase tracking-wider mb-3">Skor Keuanganmu</h3>

      {/* Score Circle */}
      <div className="flex justify-center mb-3">
        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 180 180">
            <circle cx="90" cy="90" r={radius} fill="none" stroke="#E8E4DE" strokeWidth="12" />
            <circle
              cx="90" cy="90" r={radius} fill="none"
              stroke={hasNoData ? '#E8E4DE' : color} strokeWidth="12" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl">{hasNoData ? '🆕' : emoji}</span>
            <span className="text-2xl font-bold text-navy">
              {hasNoData ? '—' : scoreValue}<span className="text-sm text-navy/40">{hasNoData ? '' : '/100'}</span>
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: hasNoData ? '#9CA3AF' : color }}>
              {hasNoData ? 'Belum Ada Data' : category}
            </span>
          </div>
        </div>
      </div>

      <p className="text-xs text-navy/50 font-medium text-center mb-4">{getDescription()}</p>

      {/* 4 Faktor Breakdown */}
      <div className="space-y-2.5">
        {factors.map((f) => (
          <div key={f.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-navy">{f.label}</span>
              <span className="text-[10px] font-bold" style={{ color: f.color }}>{f.desc}</span>
            </div>
            <div className="w-full h-2 bg-cream rounded-full border border-navy/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${f.pct}%`, backgroundColor: f.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FinancialScoreCard;