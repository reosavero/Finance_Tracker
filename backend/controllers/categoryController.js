// =====================================================
// controllers/categoryController.js
// Manajemen kategori pengeluaran & pemasukan
// =====================================================
const { pool } = require('../config/db');

const allowedTypes = ['expense', 'income'];
const hexColorRegex = /^#([0-9A-Fa-f]{6})$/;

const normalizeCategoryInput = ({ name, icon, color, type }) => ({
  name: String(name || '').trim(),
  icon: String(icon || '📌').trim() || '📌',
  color: String(color || '#6366f1').trim(),
  type: String(type || '').trim(),
});

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

    if (type && allowedTypes.includes(type)) {
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
    const user_id = req.user.id;
    const { name, icon, color, type } = normalizeCategoryInput(req.body);

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Nama dan type kategori wajib diisi.',
      });
    }

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type kategori harus expense atau income.',
      });
    }

    if (!hexColorRegex.test(color)) {
      return res.status(400).json({
        success: false,
        message: 'Warna kategori harus berupa kode hex valid, misalnya #6366f1.',
      });
    }

    const [existing] = await pool.query(
      'SELECT id FROM categories WHERE user_id = ? AND type = ? AND LOWER(name) = LOWER(?) LIMIT 1',
      [user_id, type, name]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Kategori dengan nama yang sama sudah ada pada tipe ini.',
      });
    }

    const [result] = await pool.query(
      'INSERT INTO categories (name, icon, color, type, is_default, user_id) VALUES (?, ?, ?, ?, 0, ?)',
      [name, icon, color, type, user_id]
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

// PUT — Edit kategori (default: hanya nama/icon/color; custom: semua field)
const updateCategory = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const categoryId = parseInt(req.params.id, 10);
    const { name, icon, color, type } = normalizeCategoryInput(req.body);

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: 'ID kategori tidak valid.',
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Nama kategori wajib diisi.',
      });
    }

    if (!hexColorRegex.test(color)) {
      return res.status(400).json({
        success: false,
        message: 'Warna kategori harus berupa kode hex valid, misalnya #6366f1.',
      });
    }

    // Cek apakah kategori ada dan milik user (default atau custom)
    const [categoryRows] = await pool.query(
      'SELECT id, is_default, type FROM categories WHERE id = ? AND (is_default = 1 OR user_id = ?) LIMIT 1',
      [categoryId, user_id]
    );

    if (categoryRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kategori tidak ditemukan.',
      });
    }

    const existingCategory = categoryRows[0];

    // Untuk kategori default: hanya boleh ubah nama, icon, warna (type tidak boleh diubah)
    if (existingCategory.is_default) {
      const finalType = existingCategory.type; // type tetap, tidak bisa diubah

      // Cek duplikat nama pada tipe yang sama
      const [duplicate] = await pool.query(
        'SELECT id FROM categories WHERE (is_default = 1 OR user_id = ?) AND type = ? AND LOWER(name) = LOWER(?) AND id != ? LIMIT 1',
        [user_id, finalType, name, categoryId]
      );

      if (duplicate.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Kategori dengan nama yang sama sudah ada pada tipe ini.',
        });
      }

      await pool.query(
        'UPDATE categories SET name = ?, icon = ?, color = ? WHERE id = ?',
        [name, icon, color, categoryId]
      );
    } else {
      // Kategori custom: semua field bisa diubah
      if (!type) {
        return res.status(400).json({
          success: false,
          message: 'Type kategori wajib diisi.',
        });
      }

      if (!allowedTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Type kategori harus expense atau income.',
        });
      }

      const [duplicate] = await pool.query(
        'SELECT id FROM categories WHERE user_id = ? AND type = ? AND LOWER(name) = LOWER(?) AND id != ? LIMIT 1',
        [user_id, type, name, categoryId]
      );

      if (duplicate.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Kategori dengan nama yang sama sudah ada pada tipe ini.',
        });
      }

      await pool.query(
        'UPDATE categories SET name = ?, icon = ?, color = ?, type = ? WHERE id = ? AND user_id = ? AND is_default = 0',
        [name, icon, color, type, categoryId, user_id]
      );
    }

    const [updatedCategory] = await pool.query('SELECT * FROM categories WHERE id = ?', [categoryId]);

    res.json({
      success: true,
      message: 'Kategori berhasil diperbarui!',
      data: updatedCategory[0],
    });
  } catch (error) {
    next(error);
  }
};

// DELETE — Hapus kategori kustom (hanya milik user, bukan default)
const deleteCategory = async (req, res, next) => {
  try {
    const categoryId = parseInt(req.params.id, 10);
    const user_id = req.user.id;

    const [ownedCategory] = await pool.query(
      'SELECT id, name FROM categories WHERE id = ? AND user_id = ? AND is_default = 0 LIMIT 1',
      [categoryId, user_id]
    );

    if (ownedCategory.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kategori tidak ditemukan atau tidak bisa dihapus.',
      });
    }

    const [[transactionUsage]] = await pool.query(
      'SELECT COUNT(*) AS total FROM transactions WHERE user_id = ? AND category_id = ?',
      [user_id, categoryId]
    );
    const [[budgetUsage]] = await pool.query(
      'SELECT COUNT(*) AS total FROM budgets WHERE user_id = ? AND category_id = ?',
      [user_id, categoryId]
    );
    const [[billUsage]] = await pool.query(
      'SELECT COUNT(*) AS total FROM recurring_bills WHERE user_id = ? AND category_id = ?',
      [user_id, categoryId]
    );

    if (transactionUsage.total > 0 || budgetUsage.total > 0 || billUsage.total > 0) {
      return res.status(400).json({
        success: false,
        message: 'Kategori masih digunakan di transaksi, budget, atau tagihan. Hapus/pindahkan data terkait terlebih dahulu.',
      });
    }

    await pool.query(
      'DELETE FROM categories WHERE id = ? AND user_id = ? AND is_default = 0',
      [categoryId, user_id]
    );

    res.json({ success: true, message: 'Kategori berhasil dihapus.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
