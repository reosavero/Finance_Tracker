// =====================================================
// controllers/transactionController.js
// CRUD transaksi pengeluaran & pemasukan
// =====================================================
const { pool } = require('../config/db');
const transactionService = require('../services/transactionService');

const getMonthRange = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth();
  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const endDate = new Date(year, month + 1, 0).toISOString().slice(0, 10);
  return { startDate, endDate, budgetMonth: startDate };
};

const validateExpenseBudgetLimit = async ({
  userId,
  categoryId,
  amount,
  transactionDate,
  excludeTransactionId = null,
}) => {
  const { startDate, endDate, budgetMonth } = getMonthRange(transactionDate);

  const [budgets] = await pool.query(
    `SELECT b.id, b.limit_amount, c.name AS category_name
     FROM budgets b
     JOIN categories c ON c.id = b.category_id
     WHERE b.user_id = ? AND b.category_id = ? AND b.budget_month = ?
     LIMIT 1`,
    [userId, categoryId, budgetMonth]
  );

  if (budgets.length === 0) {
    return;
  }

  const budget = budgets[0];
  let spentQuery = `
    SELECT COALESCE(SUM(amount), 0) AS total
    FROM transactions
    WHERE user_id = ?
      AND category_id = ?
      AND type = 'expense'
      AND transaction_date BETWEEN ? AND ?
  `;
  const spentParams = [userId, categoryId, startDate, endDate];

  if (excludeTransactionId) {
    spentQuery += ' AND id != ?';
    spentParams.push(excludeTransactionId);
  }

  const [[spentResult]] = await pool.query(spentQuery, spentParams);
  const currentSpent = parseFloat(spentResult.total || 0);
  const nextSpent = currentSpent + parseFloat(amount || 0);
  const limitAmount = parseFloat(budget.limit_amount || 0);

  if (nextSpent > limitAmount) {
    const remaining = Math.max(limitAmount - currentSpent, 0);
    const error = new Error(
      `Budget kategori ${budget.category_name} sudah melewati batas. Sisa anggaran: Rp${Math.round(remaining).toLocaleString('id-ID')}.`
    );
    error.status = 400;
    throw error;
  }
};

// CREATE — Tambah transaksi baru
const createTransaction = async (req, res, next) => {
  try {
    const { category_id, type, amount, description, transaction_date } = req.body;
    const user_id = req.user.id;

    // Validasi input wajib
    if (!category_id || !type || !amount || !transaction_date) {
      return res.status(400).json({
        success: false,
        message: 'category_id, type, amount, dan transaction_date wajib diisi.',
      });
    }

    if (!['expense', 'income'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type harus "expense" atau "income".',
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Nominal harus lebih dari 0.',
      });
    }

    if (type === 'expense') {
      await validateExpenseBudgetLimit({
        userId: user_id,
        categoryId: category_id,
        amount,
        transactionDate: transaction_date,
      });
    }

    const [result] = await pool.query(
      `INSERT INTO transactions (user_id, category_id, type, amount, description, transaction_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, category_id, type, amount, description || null, transaction_date]
    );

    // Ambil data lengkap transaksi yang baru dibuat
    const [newTransaction] = await pool.query(
      `SELECT t.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Transaksi berhasil dicatat!',
      data: newTransaction[0],
    });
  } catch (error) {
    next(error);
  }
};

// READ — Ambil semua transaksi user (filter, search, pagination)
const getTransactions = async (req, res, next) => {
  try {
    const result = await transactionService.getTransactions(req.user.id, req.query);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// READ — Ambil satu transaksi berdasarkan ID
const getTransactionById = async (req, res, next) => {
  try {
    const [transactions] = await pool.query(
      `SELECT t.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.id = ? AND t.user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (transactions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaksi tidak ditemukan.',
      });
    }

    res.json({ success: true, data: transactions[0] });
  } catch (error) {
    next(error);
  }
};

// UPDATE — Edit transaksi
const updateTransaction = async (req, res, next) => {
  try {
    const { category_id, type, amount, description, transaction_date } = req.body;

    // Pastikan transaksi milik user ini
    const [existing] = await pool.query(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaksi tidak ditemukan.',
      });
    }

    const current = existing[0];
    const nextCategoryId = category_id ?? current.category_id;
    const nextType = type ?? current.type;
    const nextAmount = amount ?? current.amount;
    const nextTransactionDate = transaction_date ?? current.transaction_date;

    if (nextType === 'expense') {
      await validateExpenseBudgetLimit({
        userId: req.user.id,
        categoryId: nextCategoryId,
        amount: nextAmount,
        transactionDate: nextTransactionDate,
        excludeTransactionId: req.params.id,
      });
    }

    await pool.query(
      `UPDATE transactions SET
        category_id = COALESCE(?, category_id),
        type = COALESCE(?, type),
        amount = COALESCE(?, amount),
        description = COALESCE(?, description),
        transaction_date = COALESCE(?, transaction_date)
       WHERE id = ? AND user_id = ?`,
      [category_id, type, amount, description, transaction_date, req.params.id, req.user.id]
    );

    const [updated] = await pool.query(
      `SELECT t.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.id = ?`,
      [req.params.id]
    );

    res.json({
      success: true,
      message: 'Transaksi berhasil diupdate.',
      data: updated[0],
    });
  } catch (error) {
    next(error);
  }
};

// DELETE — Hapus transaksi
const deleteTransaction = async (req, res, next) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM transactions WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaksi tidak ditemukan.',
      });
    }

    res.json({ success: true, message: 'Transaksi berhasil dihapus.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
};
