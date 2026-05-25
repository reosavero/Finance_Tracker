// =====================================================
// controllers/evaluationController.js
// Logika analisis & evaluasi keuangan bulanan
// =====================================================
const { pool } = require('../config/db');

// Helper: format tanggal lokal
const toLocalDateString = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const toLocalMonthString = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

// =====================================================
// HITUNG FINANCIAL SCORE (0-100)
// =====================================================
const calculateFinancialScore = ({ savingRatio, expenseOverAllowance, billStatus, spendingHabitScore }) => {
  // Weighted scoring
  // 1. Saving ratio (40%): ideal = 20% saving → score 40, 0% saving → score 0, negative → score -10
  let savingScore = 0;
  if (savingRatio >= 0.3) savingScore = 40;
  else if (savingRatio >= 0.2) savingScore = 35;
  else if (savingRatio >= 0.1) savingScore = 25;
  else if (savingRatio >= 0) savingScore = 15;
  else savingScore = 0;

  // 2. Budget control (30%): expense vs allowance
  let budgetScore = 0;
  if (expenseOverAllowance <= 0.5) budgetScore = 30;       // used < 50% allowance
  else if (expenseOverAllowance <= 0.8) budgetScore = 25;  // used < 80%
  else if (expenseOverAllowance <= 1.0) budgetScore = 15;  // used < 100%
  else if (expenseOverAllowance <= 1.2) budgetScore = 8;   // used < 120% (slight overspend)
  else budgetScore = 0;                                    // heavy overspend

  // 3. Bill payment (15%): are bills paid?
  let billScore = 0;
  if (billStatus === 'all_paid') billScore = 15;
  else if (billStatus === 'mostly_paid') billScore = 10;
  else if (billStatus === 'some_unpaid') billScore = 5;
  else billScore = 0;

  // 4. Spending habit (15%): healthy distribution
  let habitScore = 0;
  if (spendingHabitScore >= 0.8) habitScore = 15;
  else if (spendingHabitScore >= 0.5) habitScore = 10;
  else if (spendingHabitScore >= 0.3) habitScore = 5;
  else habitScore = 0;

  const total = savingScore + budgetScore + billScore + habitScore;
  return Math.max(0, Math.min(100, total));
};

const getScoreCategory = (score) => {
  if (score >= 80) return { label: 'Excellent', color: '#06D6A0', emoji: '🌟' };
  if (score >= 60) return { label: 'Good', color: '#4361EE', emoji: '👍' };
  if (score >= 40) return { label: 'Warning', color: '#F77F00', emoji: '⚠️' };
  return { label: 'Critical', color: '#EF476F', emoji: '🚨' };
};

// =====================================================
// GENERATE DYNAMIC INSIGHTS
// =====================================================
const generateInsights = ({
  totalIncome, totalExpense, monthlyAllowance, savingRatio,
  topCategory, biggestTransaction, smallTransactionCount,
  expenseOverAllowance, previousMonth, currentMonth,
  categoryBreakdown, billStatus
}) => {
  const insights = [];

  // === INSIGHT: Saving Ratio ===
  if (savingRatio >= 0.3) {
    insights.push({
      type: 'positive',
      icon: '💰',
      title: 'Saving Rate Sangat Baik',
      message: `Anda berhasil menabung ${Math.round(savingRatio * 100)}% dari total duit masuk bulan ini. Pertahankan kebiasaan ini!`,
    });
  } else if (savingRatio >= 0.1) {
    insights.push({
      type: 'warning',
      icon: '📉',
      title: 'Saving Rate Perlu Ditingkatkan',
      message: `Saving rate Anda ${Math.round(savingRatio * 100)}%. Idealnya menyisihkan minimal 20% dari total duit masuk.`,
    });
  } else if (savingRatio >= 0) {
    insights.push({
      type: 'danger',
      icon: '⚠️',
      title: 'Hampir Tidak Ada Tabungan',
      message: `Hanya ${Math.round(savingRatio * 100)}% duit masuk yang tersisa. Evaluasi pengeluaran Anda.`,
    });
  } else {
    insights.push({
      type: 'danger',
      icon: '🚨',
      title: 'Defisit! Pengeluaran Melebihi Pemasukan',
      message: `Pengeluaran melebihi pemasukan sebesar Rp ${Math.abs(Math.round(totalIncome - totalExpense)).toLocaleString('id-ID')}. Segera evaluasi keuangan Anda!`,
    });
  }

  // === INSIGHT: Top Category ===
  if (topCategory && categoryBreakdown.length > 0) {
    const catPercent = topCategory.total / totalExpense * 100;
    if (catPercent >= 40) {
      insights.push({
        type: 'danger',
        icon: '🔥',
        title: 'Kategori Dominan Terlalu Besar',
        message: `${topCategory.name} menghabiskan ${Math.round(catPercent)}% dari total pengeluaran. Ini terlalu dominan, coba diversified spending.`,
      });
    } else if (catPercent >= 25) {
      insights.push({
        type: 'warning',
        icon: '📊',
        title: 'Kategori Terbesar',
        message: `${topCategory.name} menghabiskan ${Math.round(catPercent)}% dari total pengeluaran (${formatRp(topCategory.total)}).`,
      });
    } else {
      insights.push({
        type: 'positive',
        icon: '✅',
        title: 'Pengeluaran Merata',
        message: 'Pengeluaran Anda cukup terdistribusi, tidak ada kategori yang terlalu dominan.',
      });
    }
  }

  // === INSIGHT: Overspending ===
  if (expenseOverAllowance > 1.0) {
    const overAmount = totalExpense - monthlyAllowance - totalIncome + totalExpense;
    insights.push({
      type: 'danger',
      icon: '💸',
      title: 'Pengeluaran Melebihi Kapasitas',
      message: `Pengeluaran ${Math.round(expenseOverAllowance * 100)}% dari uang bulanan + pemasukan. Anda hidup di atas kemampuan keuangan!`,
    });
  } else if (expenseOverAllowance > 0.8) {
    insights.push({
      type: 'warning',
      icon: '⚡',
      title: 'Hampir Mencapai Batas',
      message: `Pengeluaran sudah ${Math.round(expenseOverAllowance * 100)}% dari kapasitas. Hati-hati agar tidak boncos.`,
    });
  }

  // === INSIGHT: Small Frequent Transactions ===
  if (smallTransactionCount >= 15) {
    insights.push({
      type: 'warning',
      icon: '🐛',
      title: 'Terlalu Banyak Transaksi Kecil',
      message: `Anda melakukan ${smallTransactionCount} transaksi kecil (≤ Rp 20.000) bulan ini. Akumulasi bisa membengkak tanpa disadari.`,
    });
  } else if (smallTransactionCount >= 8) {
    insights.push({
      type: 'info',
      icon: '🔍',
      title: 'Cukup Banyak Transaksi Kecil',
      message: `${smallTransactionCount} transaksi kecil bulan ini. Perhatikan apakah ada yang bisa dikurangi.`,
    });
  }

  // === INSIGHT: Biggest Transaction ===
  if (biggestTransaction) {
    const bigPercent = biggestTransaction.amount / totalExpense * 100;
    if (bigPercent >= 30) {
      insights.push({
        type: 'warning',
        icon: '🎯',
        title: 'Transaksi Besar Terdeteksi',
        message: `Transaksi terbesar: "${biggestTransaction.description || biggestTransaction.category_name}" sebesar ${formatRp(biggestTransaction.amount)} (${Math.round(bigPercent)}% dari total expense).`,
      });
    }
  }

  // === INSIGHT: Month Comparison ===
  if (previousMonth && previousMonth.total_expense > 0) {
    const expenseChange = ((totalExpense - previousMonth.total_expense) / previousMonth.total_expense) * 100;
    if (expenseChange > 20) {
      insights.push({
        type: 'danger',
        icon: '📈',
        title: 'Pengeluaran Naik Drastis',
        message: `Pengeluaran naik ${Math.round(expenseChange)}% dibanding bulan lalu. Cek apa yang menyebabkan kenaikan.`,
      });
    } else if (expenseChange > 5) {
      insights.push({
        type: 'warning',
        icon: '📈',
        title: 'Pengeluaran Sedikit Naik',
        message: `Pengeluaran naik ${Math.round(expenseChange)}% dari bulan lalu. Masih dalam batas wajar.`,
      });
    } else if (expenseChange < -10) {
      insights.push({
        type: 'positive',
        icon: '📉',
        title: 'Pengeluaran Turun!',
        message: `Pengeluaran turun ${Math.round(Math.abs(expenseChange))}% dari bulan lalu. Kerja bagus! 🎉`,
      });
    }
  }

  // === INSIGHT: Bills Status ===
  if (billStatus === 'some_unpaid' || billStatus === 'none_paid') {
    insights.push({
      type: 'danger',
      icon: '📑',
      title: 'Tagihan Belum Dibayar',
      message: 'Masih ada tagihan bulan ini yang belum dibayar. Segera bayar untuk menghindari denda.',
    });
  }

  return insights;
};

// =====================================================
// GENERATE RECOMMENDATIONS
// =====================================================
const generateRecommendations = ({
  totalIncome, totalExpense, monthlyAllowance, savingRatio,
  topCategory, categoryBreakdown, expenseOverAllowance,
  smallTransactionCount, previousMonth, billStatus
}) => {
  const recommendations = [];

  // 1. Saving improvement
  if (savingRatio < 0.2 && totalIncome > 0) {
    const targetSave = totalIncome * 0.2;
    const currentSave = totalIncome - totalExpense;
    const gap = targetSave - currentSave;
    if (gap > 0) {
      recommendations.push({
        priority: 'high',
        icon: '💰',
        title: 'Tingkatkan Saving Rate ke 20%',
        action: `Kurangi pengeluaran sekitar ${formatRp(gap)} untuk mencapai target tabungan 20%.`,
        category: 'saving',
      });
    }
  }

  // 2. Category reduction
  if (topCategory && categoryBreakdown.length > 0) {
    const catPercent = topCategory.total / totalExpense * 100;
    if (catPercent >= 30) {
      const reduceAmount = topCategory.total * 0.2;
      recommendations.push({
        priority: 'high',
        icon: '✂️',
        title: `Kurangi Pengeluaran ${topCategory.name}`,
        action: `Coba kurangi 20% dari ${topCategory.name} = hemat ${formatRp(reduceAmount)} bulan depan.`,
        category: 'spending',
      });
    }
  }

  // 3. Overspending fix
  if (expenseOverAllowance > 1.0) {
    const excess = totalExpense - (monthlyAllowance + (totalIncome - totalExpense));
    recommendations.push({
      priority: 'critical',
      icon: '🛑',
      title: 'Hentikan Overspending',
      action: `Anda overspending bulan ini. Buat budget yang lebih realistis dan patuhi batas harian.`,
      category: 'budget',
    });
  }

  // 4. Small transactions awareness
  if (smallTransactionCount >= 10) {
    recommendations.push({
      priority: 'medium',
      icon: '📝',
      title: 'Batasi Transaksi Kecil',
      action: `Coba batasi transaksi ≤ Rp 20.000. Pakai metode "wait 24hr" untuk pembelian impulsif.`,
      category: 'habit',
    });
  }

  // 5. Emergency fund reminder
  if (savingRatio >= 0.1 && savingRatio < 0.2) {
    recommendations.push({
      priority: 'medium',
      icon: '🏦',
      title: 'Bangun Dana Darurat',
      action: 'Targetkan 3-6 bulan pengeluaran untuk dana darurat. Saat ini saving rate belum cukup.',
      category: 'saving',
    });
  }

  // 6. Bills reminder
  if (billStatus !== 'all_paid') {
    recommendations.push({
      priority: 'high',
      icon: '📋',
      title: 'Bayar Tagihan Tertunda',
      action: 'Segera bayar tagihan yang belum diselesaikan untuk menghindari penalti atau denda keterlambatan.',
      category: 'bills',
    });
  }

  // 7. Monthly budget creation
  if (expenseOverAllowance > 0.9) {
    recommendations.push({
      priority: 'medium',
      icon: '📊',
      title: 'Buat Budget Bulanan',
      action: 'Buat anggaran per kategori dan patuhi. Gunakan fitur Anggaran di app untuk tracking.',
      category: 'budget',
    });
  }

  // 8. Income diversification
  if (totalIncome <= monthlyAllowance * 0.1) {
    recommendations.push({
      priority: 'low',
      icon: '💡',
      title: 'Diversifikasi Pemasukan',
      action: 'Pemasukan tambahan masih sangat sedikit. Pertimbangkan side income atau freelance.',
      category: 'income',
    });
  }

  // 9. Positive reinforcement when doing well
  if (savingRatio >= 0.3 && expenseOverAllowance <= 0.7) {
    recommendations.push({
      priority: 'info',
      icon: '🌟',
      title: 'Pertahankan Kebiasaan Ini!',
      action: 'Keuangan Anda sangat sehat bulan ini. Teruskan disiplin finansial Anda!',
      category: 'positive',
    });
  }

  return recommendations;
};

// Helper format Rupiah
function formatRp(n) {
  return 'Rp ' + Math.round(n).toLocaleString('id-ID');
}

// =====================================================
// MAIN: GET MONTHLY EVALUATION
// =====================================================
const getMonthlyEvaluation = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const now = new Date();
    const currentMonth = toLocalMonthString(now);
    const startOfMonth = `${currentMonth}-01`;
    const endOfMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const endOfMonth = toLocalDateString(endOfMonthDate);

    // Previous month
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = toLocalMonthString(prevDate);
    const prevStart = `${prevMonth}-01`;
    const prevEnd = toLocalDateString(new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 0));

    // ==============================
    // 1. User data (allowance)
    // ==============================
    const [users] = await pool.query('SELECT monthly_allowance FROM users WHERE id = ?', [user_id]);
    const monthlyAllowance = parseFloat(users[0]?.monthly_allowance) || 0;

    // ==============================
    // 2. Current month summary
    // ==============================
    const [incomeResult] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM transactions
       WHERE user_id = ? AND type = 'income' AND transaction_date BETWEEN ? AND ?`,
      [user_id, startOfMonth, endOfMonth]
    );
    const totalIncome = parseFloat(incomeResult[0].total);

    const [expenseResult] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM transactions
       WHERE user_id = ? AND type = 'expense' AND transaction_date BETWEEN ? AND ?`,
      [user_id, startOfMonth, endOfMonth]
    );
    const totalExpense = parseFloat(expenseResult[0].total);

    const balance = monthlyAllowance + totalIncome - totalExpense;
    const totalCapacity = monthlyAllowance + totalIncome;
    const savingRatio = totalCapacity > 0 ? (totalCapacity - totalExpense) / totalCapacity : (totalExpense > 0 ? -0.5 : 0);

    // ==============================
    // 3. Category breakdown
    // ==============================
    const [categoryBreakdown] = await pool.query(
      `SELECT c.id, c.name, c.icon, c.color, SUM(t.amount) AS total, COUNT(*) AS count
       FROM transactions t JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = ? AND t.type = 'expense' AND t.transaction_date BETWEEN ? AND ?
       GROUP BY c.id, c.name, c.icon, c.color ORDER BY total DESC`,
      [user_id, startOfMonth, endOfMonth]
    );

    const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;

    // ==============================
    // 4. Biggest transaction
    // ==============================
    const [biggestTransactions] = await pool.query(
      `SELECT t.amount, t.description, t.transaction_date, c.name AS category_name, c.icon AS category_icon
       FROM transactions t JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = ? AND t.type = 'expense' AND t.transaction_date BETWEEN ? AND ?
       ORDER BY t.amount DESC LIMIT 5`,
      [user_id, startOfMonth, endOfMonth]
    );
    const biggestTransaction = biggestTransactions.length > 0 ? biggestTransactions[0] : null;

    // ==============================
    // 5. Small frequent transactions (≤ 20000)
    // ==============================
    const [smallTxResult] = await pool.query(
      `SELECT COUNT(*) AS count FROM transactions
       WHERE user_id = ? AND type = 'expense' AND amount <= 20000 AND transaction_date BETWEEN ? AND ?`,
      [user_id, startOfMonth, endOfMonth]
    );
    const smallTransactionCount = smallTxResult[0].count;

    // ==============================
    // 6. Frequent spending categories
    // ==============================
    const [frequentCategories] = await pool.query(
      `SELECT c.name, c.icon, COUNT(*) AS tx_count, SUM(t.amount) AS total
       FROM transactions t JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = ? AND t.type = 'expense' AND t.transaction_date BETWEEN ? AND ?
       GROUP BY c.id ORDER BY tx_count DESC LIMIT 5`,
      [user_id, startOfMonth, endOfMonth]
    );

    // ==============================
    // 7. Bill status
    // ==============================
    const [totalBills] = await pool.query(
      `SELECT COUNT(*) AS total FROM recurring_bills WHERE user_id = ? AND is_active = 1`, [user_id]
    );
    const [paidBills] = await pool.query(
      `SELECT COUNT(*) AS total FROM recurring_bills
       WHERE user_id = ? AND is_active = 1
       AND DATE_FORMAT(last_paid_date, '%Y-%m') = ?`,
      [user_id, currentMonth]
    );
    const totalBillsCount = totalBills[0].total;
    const paidBillsCount = paidBills[0].total;
    let billStatus = 'no_bills';
    if (totalBillsCount > 0) {
      if (paidBillsCount >= totalBillsCount) billStatus = 'all_paid';
      else if (paidBillsCount >= totalBillsCount * 0.5) billStatus = 'mostly_paid';
      else if (paidBillsCount > 0) billStatus = 'some_unpaid';
      else billStatus = 'none_paid';
    }

    // ==============================
    // 8. Previous month comparison
    // ==============================
    let previousMonth = null;
    if (prevMonth) {
      const [prevIncome] = await pool.query(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM transactions
         WHERE user_id = ? AND type = 'income' AND transaction_date BETWEEN ? AND ?`,
        [user_id, prevStart, prevEnd]
      );
      const [prevExpense] = await pool.query(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM transactions
         WHERE user_id = ? AND type = 'expense' AND transaction_date BETWEEN ? AND ?`,
        [user_id, prevStart, prevEnd]
      );
      const prevIncomeVal = parseFloat(prevIncome[0].total);
      const prevExpenseVal = parseFloat(prevExpense[0].total);
      if (prevIncomeVal > 0 || prevExpenseVal > 0) {
        const prevCapacity = monthlyAllowance + prevIncomeVal;
        const prevSavingRatio = prevCapacity > 0 ? (prevCapacity - prevExpenseVal) / prevCapacity : -0.5;
        previousMonth = {
          month: prevMonth,
          total_income: prevIncomeVal,
          total_expense: prevExpenseVal,
          saving_ratio: prevSavingRatio,
        };
      }
    }

    // ==============================
    // 9. Expense over allowance ratio
    // ==============================
    const expenseOverAllowance = totalCapacity > 0 ? totalExpense / totalCapacity : 0;

    // ==============================
    // 10. Spending habit score
    // ==============================
    // Healthy = diverse categories, no single dominant, moderate frequency
    let spendingHabitScore = 0;
    if (categoryBreakdown.length >= 3) spendingHabitScore += 0.4;
    else if (categoryBreakdown.length >= 2) spendingHabitScore += 0.2;
    if (topCategory && topCategory.total / totalExpense < 0.5) spendingHabitScore += 0.3;
    if (totalExpense > 0 && totalExpense / (monthlyAllowance + totalIncome) <= 0.8) spendingHabitScore += 0.3;

    // ==============================
    // 11. Financial score
    // ==============================
    const financialScore = calculateFinancialScore({
      savingRatio,
      expenseOverAllowance,
      billStatus,
      spendingHabitScore,
    });
    const scoreCategory = getScoreCategory(financialScore);

    // ==============================
    // 12. Monthly trend (last 6 months)
    // ==============================
    const [trendData] = await pool.query(
      `SELECT
        DATE_FORMAT(t.transaction_date, '%Y-%m') AS month,
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) AS expense
       FROM transactions t
       WHERE t.user_id = ?
       GROUP BY DATE_FORMAT(t.transaction_date, '%Y-%m')
       ORDER BY month ASC
       LIMIT 6`,
      [user_id]
    );

    // ==============================
    // 13. Generate insights & recommendations
    // ==============================
    const insights = generateInsights({
      totalIncome, totalExpense, monthlyAllowance, savingRatio,
      topCategory, biggestTransaction, smallTransactionCount,
      expenseOverAllowance, previousMonth, currentMonth,
      categoryBreakdown, billStatus,
    });

    const recommendations = generateRecommendations({
      totalIncome, totalExpense, monthlyAllowance, savingRatio,
      topCategory, categoryBreakdown, expenseOverAllowance,
      smallTransactionCount, previousMonth, billStatus,
    });

    // ==============================
    // 14. Cashflow percentage
    // ==============================
    const cashflowPercent = totalCapacity > 0 ? ((totalCapacity - totalExpense) / totalCapacity) * 100 : 0;

    // ==============================
    // Response
    // ==============================
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    res.json({
      success: true,
      data: {
        month: currentMonth,
        summary: {
          total_income: totalIncome,
          total_expense: totalExpense,
          balance,
          monthly_allowance: monthlyAllowance,
          saving_ratio: Math.round(savingRatio * 100) / 100,
          cashflow_percent: Math.round(cashflowPercent * 10) / 10,
          total_capacity: totalCapacity,
          expense_over_allowance: Math.round(expenseOverAllowance * 100) / 100,
        },
        financial_score: {
          score: financialScore,
          category: scoreCategory.label,
          color: scoreCategory.color,
          emoji: scoreCategory.emoji,
        },
        spending_analysis: {
          top_category: topCategory,
          category_breakdown: categoryBreakdown,
          biggest_transactions: biggestTransactions,
          frequent_categories: frequentCategories,
          small_transaction_count: smallTransactionCount,
        },
        bill_status: {
          total: totalBillsCount,
          paid: paidBillsCount,
          status: billStatus,
        },
        month_comparison: previousMonth ? {
          ...previousMonth,
          expense_change: previousMonth.total_expense > 0
            ? Math.round(((totalExpense - previousMonth.total_expense) / previousMonth.total_expense) * 100)
            : null,
          income_change: previousMonth.total_income > 0
            ? Math.round(((totalIncome - previousMonth.total_income) / previousMonth.total_income) * 100)
            : null,
        } : null,
        trend: trendData,
        insights,
        recommendations,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMonthlyEvaluation };