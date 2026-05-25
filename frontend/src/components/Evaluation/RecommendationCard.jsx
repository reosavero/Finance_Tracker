import { HiOutlineSparkles } from 'react-icons/hi';

const PRIORITY_STYLES = {
  critical: { bg: 'bg-expense/5', border: 'border-expense/30', badge: 'bg-expense text-white', label: 'Kritis' },
  high:     { bg: 'bg-warning/5', border: 'border-warning/30', badge: 'bg-warning text-navy', label: 'Penting' },
  medium:   { bg: 'bg-primary/5', border: 'border-primary/30', badge: 'bg-primary text-white', label: 'Sedang' },
  low:      { bg: 'bg-cream', border: 'border-navy/10', badge: 'bg-navy/10 text-navy', label: 'Info' },
  info:     { bg: 'bg-income/5', border: 'border-income/30', badge: 'bg-income text-navy', label: '✨' },
};

const RecommendationCard = ({ recommendations }) => {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="brutal-card animate-slide-up">
        <div className="flex items-center gap-2 mb-4">
          <HiOutlineSparkles className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-navy">Rekomendasi</h3>
        </div>
        <p className="text-center text-navy/30 font-medium py-8">Belum ada rekomendasi.</p>
      </div>
    );
  }

  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  const sorted = [...recommendations].sort((a, b) =>
    (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9)
  );

  return (
    <div className="brutal-card animate-slide-up flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <HiOutlineSparkles className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold text-navy">Rekomendasi Financial</h3>
      </div>

      <div className="space-y-3 flex-1">
        {sorted.map((rec, i) => {
          const style = PRIORITY_STYLES[rec.priority] || PRIORITY_STYLES.medium;
          return (
            <div key={i} className={`border-2 rounded-brutal p-4 ${style.border} ${style.bg} transition-all hover:shadow-brutal-sm hover:-translate-y-0.5`}>
              <div className="flex items-start gap-3">
                <span className="text-xl shrink-0 mt-0.5">{rec.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="text-sm font-bold text-navy">{rec.title}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg ${style.badge}`}>
                      {style.label}
                    </span>
                  </div>
                  <p className="text-xs text-navy/50 font-medium leading-relaxed">{rec.action}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendationCard;