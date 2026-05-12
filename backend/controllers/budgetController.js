// =====================================================
// controllers/budgetController.js
// Manajemen limit anggaran per kategori per bulan
// =====================================================
const { pool } = require('../config/db');

// GET — Ambil semua budget bulan tertentu + total spent
const getBudgets = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const { month } = req.query; // Format: YYYY-MM

    // Default ke bulan saat ini
    const budgetMonth = month
      ? `${month}-01`
      : new Date().toISOString().slice(0, 7) + '-01';

    const startDate = budgetMonth;
    const endDate = new Date(
      new Date(budgetMonth).getFullYear(),
      new Date(budgetMonth).getMonth() + 1,
      0
    ).toISOString().slice(0, 10);

    const [budgets] = await pool.query(
      `SELECT 
        b.id,
        b.category_id,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color,
        b.limit_amount,
        b.budget_month,
        COALESCE(SUM(t.amount), 0) AS spent_amount
       FROM budgets b
       JOIN categories c ON b.category_id = c.id
       LEFT JOIN transactions t ON t.category_id = b.category_id
         AND t.user_id = b.user_id
         AND t.type = 'expense'
         AND t.transaction_date BETWEEN ? AND ?
       WHERE b.user_id = ? AND b.budget_month = ?
       GROUP BY b.id, b.category_id, c.name, c.icon, c.color, b.limit_amount, b.budget_month
       ORDER BY c.name`,
      [startDate, endDate, user_id, budgetMonth]
    );

    // Hitung persentase dan status
    const enriched = budgets.map((b) => {
      const percentage = b.limit_amount > 0
        ? Math.round((b.spent_amount / b.limit_amount) * 100)
        : 0;
      let status = 'safe';
      if (percentage >= 100) status = 'exceeded';
      else if (percentage >= 80) status = 'warning';
      else if (percentage >= 60) status = 'caution';

      return { ...b, percentage, status, remaining: b.limit_amount - b.spent_amount };
    });

    res.json({ success: true, data: enriched });
  } catch (error) {
    next(error);
  }
};

// POST — Set/Create budget untuk kategori
const createBudget = async (req, res, next) => {
  try {
    const { category_id, limit_amount, budget_month } = req.body;
    const user_id = req.user.id;

    if (!category_id || !limit_amount) {
      return res.status(400).json({
        success: false,
        message: 'category_id dan limit_amount wajib diisi.',
      });
    }

    const month = budget_month
      ? `${budget_month}-01`
      : new Date().toISOString().slice(0, 7) + '-01';

    // Upsert: update jika sudah ada, insert jika belum
    await pool.query(
      `INSERT INTO budgets (user_id, category_id, limit_amount, budget_month)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE limit_amount = VALUES(limit_amount)`,
      [user_id, category_id, limit_amount, month]
    );

    res.status(201).json({
      success: true,
      message: 'Budget berhasil disimpan!',
    });
  } catch (error) {
    next(error);
  }
};

// PUT — Update budget
const updateBudget = async (req, res, next) => {
  try {
    const { limit_amount } = req.body;

    const [result] = await pool.query(
      'UPDATE budgets SET limit_amount = ? WHERE id = ? AND user_id = ?',
      [limit_amount, req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Budget tidak ditemukan.',
      });
    }

    res.json({ success: true, message: 'Budget berhasil diupdate.' });
  } catch (error) {
    next(error);
  }
};

// DELETE — Hapus budget
const deleteBudget = async (req, res, next) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM budgets WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Budget tidak ditemukan.',
      });
    }

    res.json({ success: true, message: 'Budget berhasil dihapus.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getBudgets, createBudget, updateBudget, deleteBudget };
