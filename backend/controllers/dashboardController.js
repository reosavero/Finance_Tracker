// =====================================================
// controllers/dashboardController.js
// Data ringkasan untuk halaman Dashboard
// =====================================================
const { pool } = require('../config/db');

// Helper: format tanggal lokal (bukan UTC) agar sesuai WIB
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

const getDashboardSummary = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const now = new Date();
    const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const endOfMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const endOfMonth = toLocalDateString(endOfMonthDate);

    // 1. Data user (uang bulanan)
    const [users] = await pool.query(
      'SELECT monthly_allowance FROM users WHERE id = ?', [user_id]
    );
    const monthlyAllowance = users[0]?.monthly_allowance || 0;

    // 2. Total pemasukan bulan ini
    const [incomeResult] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM transactions
       WHERE user_id = ? AND type = 'income' AND transaction_date BETWEEN ? AND ?`,
      [user_id, startOfMonth, endOfMonth]
    );
    const totalIncome = parseFloat(incomeResult[0].total);

    // 3. Total pengeluaran bulan ini
    const [expenseResult] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM transactions
       WHERE user_id = ? AND type = 'expense' AND transaction_date BETWEEN ? AND ?`,
      [user_id, startOfMonth, endOfMonth]
    );
    const totalExpense = parseFloat(expenseResult[0].total);

    // 4. Pengeluaran per kategori (untuk chart)
    const [categoryBreakdown] = await pool.query(
      `SELECT c.id, c.name, c.icon, c.color, SUM(t.amount) AS total
       FROM transactions t JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = ? AND t.type = 'expense' AND t.transaction_date BETWEEN ? AND ?
       GROUP BY c.id, c.name, c.icon, c.color ORDER BY total DESC`,
      [user_id, startOfMonth, endOfMonth]
    );

    // 5. Transaksi terakhir (5 terbaru)
    const [recentTransactions] = await pool.query(
      `SELECT t.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
       FROM transactions t JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = ? ORDER BY t.transaction_date DESC, t.created_at DESC LIMIT 5`,
      [user_id]
    );

    // 6. Tagihan yang akan jatuh tempo — beserta kategori & due_status
    const [upcomingBills] = await pool.query(
      `SELECT rb.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
       FROM recurring_bills rb
       LEFT JOIN categories c ON rb.category_id = c.id
       WHERE rb.user_id = ? AND rb.is_active = 1
       AND (rb.last_paid_date IS NULL OR rb.last_paid_date < ?)
       ORDER BY rb.due_day ASC LIMIT 5`,
      [user_id, startOfMonth]
    );

    // Enrich bills with due_status (konsisten dengan billController)
    const currentDay = now.getDate();
    const currentMonth = toLocalMonthString(now);

    const enrichedBills = upcomingBills.map((bill) => {
      const lastPaidMonth = bill.last_paid_date
        ? toLocalMonthString(new Date(bill.last_paid_date))
        : null;
      const isPaidThisMonth = lastPaidMonth === currentMonth;
      let due_status = 'upcoming';
      if (isPaidThisMonth) due_status = 'paid';
      else if (currentDay > bill.due_day) due_status = 'overdue';
      else if (bill.due_day - currentDay <= 3) due_status = 'due_soon';
      return { ...bill, due_status, is_paid_this_month: isPaidThisMonth };
    });

    const balance = monthlyAllowance + totalIncome - totalExpense;

    // 7. Riwayat bulanan (6 bulan terakhir yang ada transaksi)
    const [monthlyHistory] = await pool.query(
      `SELECT
        DATE_FORMAT(t.transaction_date, '%Y-%m') AS month,
        COUNT(*) AS transaction_count,
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) AS total_expense
       FROM transactions t
       WHERE t.user_id = ?
       GROUP BY DATE_FORMAT(t.transaction_date, '%Y-%m')
       ORDER BY month DESC
       LIMIT 6`,
      [user_id]
    );

    // Cache-control: pastikan browser tidak cache data dashboard
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    res.json({
      success: true,
      data: {
        monthly_allowance: monthlyAllowance,
        total_income: totalIncome,
        total_expense: totalExpense,
        balance,
        category_breakdown: categoryBreakdown,
        recent_transactions: recentTransactions,
        upcoming_bills: enrichedBills,
        monthly_history: monthlyHistory,
        month: now.toISOString().slice(0, 7),
      },
    });
  } catch (error) { next(error); }
};

module.exports = { getDashboardSummary };
