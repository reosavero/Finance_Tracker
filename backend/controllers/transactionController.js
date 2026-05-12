// =====================================================
// controllers/transactionController.js
// CRUD transaksi pengeluaran & pemasukan
// =====================================================
const { pool } = require('../config/db');

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

// READ — Ambil semua transaksi user (dengan filter)
const getTransactions = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const { type, category_id, start_date, end_date, page = 1, limit = 20 } = req.query;

    let query = `
      SELECT t.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?
    `;
    const params = [user_id];

    // Filter by type
    if (type && ['expense', 'income'].includes(type)) {
      query += ' AND t.type = ?';
      params.push(type);
    }

    // Filter by category
    if (category_id) {
      query += ' AND t.category_id = ?';
      params.push(category_id);
    }

    // Filter by date range
    if (start_date) {
      query += ' AND t.transaction_date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND t.transaction_date <= ?';
      params.push(end_date);
    }

    // Count total for pagination
    const countQuery = query.replace(
      /SELECT t\.\*, c\.name AS category_name, c\.icon AS category_icon, c\.color AS category_color/,
      'SELECT COUNT(*) AS total'
    );
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0].total;

    // Order & pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' ORDER BY t.transaction_date DESC, t.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [transactions] = await pool.query(query, params);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
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
      'SELECT id FROM transactions WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaksi tidak ditemukan.',
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
