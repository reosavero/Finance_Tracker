// =====================================================
// controllers/dashboardController.js
// Data ringkasan untuk halaman Dashboard
// =====================================================
const { pool } = require('../config/db');

const getDashboardSummary = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const now = new Date();
    const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

    // 1. Data user (uang saku bulanan)
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

    // 6. Tagihan yang akan jatuh tempo
    const [upcomingBills] = await pool.query(
      `SELECT * FROM recurring_bills WHERE user_id = ? AND is_active = 1
       AND (last_paid_date IS NULL OR last_paid_date < ?)
       ORDER BY due_day ASC LIMIT 5`,
      [user_id, startOfMonth]
    );

    const balance = monthlyAllowance + totalIncome - totalExpense;

    res.json({
      success: true,
      data: {
        monthly_allowance: monthlyAllowance,
        total_income: totalIncome,
        total_expense: totalExpense,
        balance,
        category_breakdown: categoryBreakdown,
        recent_transactions: recentTransactions,
        upcoming_bills: upcomingBills,
        month: now.toISOString().slice(0, 7),
      },
    });
  } catch (error) { next(error); }
};

module.exports = { getDashboardSummary };
