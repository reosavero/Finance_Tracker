// =====================================================
// controllers/billController.js
// Manajemen tagihan rutin bulanan
// =====================================================
const { pool } = require('../config/db');

const getBills = async (req, res, next) => {
  try {
    const [bills] = await pool.query(
      `SELECT rb.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
       FROM recurring_bills rb
       LEFT JOIN categories c ON rb.category_id = c.id
       WHERE rb.user_id = ? ORDER BY rb.due_day ASC`,
      [req.user.id]
    );

    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.toISOString().slice(0, 7);

    const enriched = bills.map((bill) => {
      const lastPaidMonth = bill.last_paid_date
        ? new Date(bill.last_paid_date).toISOString().slice(0, 7) : null;
      const isPaidThisMonth = lastPaidMonth === currentMonth;
      let due_status = 'upcoming';
      if (isPaidThisMonth) due_status = 'paid';
      else if (currentDay > bill.due_day) due_status = 'overdue';
      else if (bill.due_day - currentDay <= 3) due_status = 'due_soon';
      return { ...bill, due_status, is_paid_this_month: isPaidThisMonth };
    });

    res.json({ success: true, data: enriched });
  } catch (error) { next(error); }
};

const createBill = async (req, res, next) => {
  try {
    const { name, amount, due_day, category_id } = req.body;
    if (!name || !amount || !due_day) {
      return res.status(400).json({ success: false, message: 'name, amount, dan due_day wajib diisi.' });
    }
    const [result] = await pool.query(
      'INSERT INTO recurring_bills (user_id, name, amount, due_day, category_id) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, name, amount, due_day, category_id || null]
    );
    const [newBill] = await pool.query(
      `SELECT rb.*, c.name AS category_name FROM recurring_bills rb
       LEFT JOIN categories c ON rb.category_id = c.id WHERE rb.id = ?`,
      [result.insertId]
    );
    res.status(201).json({ success: true, message: 'Tagihan berhasil ditambahkan!', data: newBill[0] });
  } catch (error) { next(error); }
};

const updateBill = async (req, res, next) => {
  try {
    const { name, amount, due_day, category_id, is_active } = req.body;
    const [result] = await pool.query(
      `UPDATE recurring_bills SET name=COALESCE(?,name), amount=COALESCE(?,amount),
       due_day=COALESCE(?,due_day), category_id=COALESCE(?,category_id),
       is_active=COALESCE(?,is_active) WHERE id=? AND user_id=?`,
      [name, amount, due_day, category_id, is_active, req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Tagihan tidak ditemukan.' });
    res.json({ success: true, message: 'Tagihan berhasil diupdate.' });
  } catch (error) { next(error); }
};

const markBillPaid = async (req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const [result] = await pool.query(
      'UPDATE recurring_bills SET last_paid_date = ? WHERE id = ? AND user_id = ?',
      [today, req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Tagihan tidak ditemukan.' });
    res.json({ success: true, message: 'Tagihan ditandai sudah dibayar.' });
  } catch (error) { next(error); }
};

const deleteBill = async (req, res, next) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM recurring_bills WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Tagihan tidak ditemukan.' });
    res.json({ success: true, message: 'Tagihan berhasil dihapus.' });
  } catch (error) { next(error); }
};

module.exports = { getBills, createBill, updateBill, markBillPaid, deleteBill };
