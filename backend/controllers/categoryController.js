// =====================================================
// controllers/categoryController.js
// Manajemen kategori pengeluaran & pemasukan
// =====================================================
const { pool } = require('../config/db');

// GET — Ambil semua kategori (default + milik user)
const getCategories = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const { type } = req.query;

    let query = `
      SELECT * FROM categories
      WHERE (is_default = 1 OR user_id = ?)
    `;
    const params = [user_id];

    if (type && ['expense', 'income'].includes(type)) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY is_default DESC, name ASC';

    const [categories] = await pool.query(query, params);

    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

// POST — Tambah kategori kustom user
const createCategory = async (req, res, next) => {
  try {
    const { name, icon, color, type } = req.body;
    const user_id = req.user.id;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Nama dan type kategori wajib diisi.',
      });
    }

    const [result] = await pool.query(
      'INSERT INTO categories (name, icon, color, type, is_default, user_id) VALUES (?, ?, ?, ?, 0, ?)',
      [name, icon || '📌', color || '#6366f1', type, user_id]
    );

    const [newCategory] = await pool.query('SELECT * FROM categories WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Kategori berhasil ditambahkan!',
      data: newCategory[0],
    });
  } catch (error) {
    next(error);
  }
};

// DELETE — Hapus kategori kustom (hanya milik user, bukan default)
const deleteCategory = async (req, res, next) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM categories WHERE id = ? AND user_id = ? AND is_default = 0',
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kategori tidak ditemukan atau tidak bisa dihapus.',
      });
    }

    res.json({ success: true, message: 'Kategori berhasil dihapus.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCategories, createCategory, deleteCategory };
