// =====================================================
// controllers/billController.js
// Manajemen tagihan rutin bulanan
// Dengan integrasi saldo & transaksi otomatis
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

// Helper: format rupiah untuk pesan error
const formatRupiah = (n) => 'Rp' + Math.round(Number(n)).toLocaleString('id-ID');

// =====================================================
// GET — Ambil semua tagihan user
// =====================================================
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
    const currentMonth = toLocalMonthString(today);

    const enriched = bills.map((bill) => {
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

    res.json({ success: true, data: enriched });
  } catch (error) { next(error); }
};

// =====================================================
// POST — Buat tagihan baru
// =====================================================
const createBill = async (req, res, next) => {
  try {
    const { name, amount, due_day, category_id } = req.body;
    if (!name || !amount || !due_day) {
      return res.status(400).json({ success: false, message: 'name, amount, dan due_day wajib diisi.' });
    }
    if (Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Nominal tagihan harus lebih dari 0.' });
    }
    const dueDayNum = Number(due_day);
    if (!Number.isInteger(dueDayNum) || dueDayNum < 1 || dueDayNum > 31) {
      return res.status(400).json({ success: false, message: 'Tanggal jatuh tempo harus antara 1-31.' });
    }
    const [result] = await pool.query(
      'INSERT INTO recurring_bills (user_id, name, amount, due_day, category_id) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, name.trim(), amount, dueDayNum, category_id || null]
    );
    const [newBill] = await pool.query(
      `SELECT rb.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
       FROM recurring_bills rb
       LEFT JOIN categories c ON rb.category_id = c.id
       WHERE rb.id = ?`,
      [result.insertId]
    );
    res.status(201).json({ success: true, message: 'Tagihan berhasil ditambahkan! 🔔', data: newBill[0] });
  } catch (error) { next(error); }
};

// =====================================================
// PUT — Update tagihan
// =====================================================
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

// =====================================================
// PUT /:id/pay — Bayar tagihan (integrasi saldo & transaksi)
// =====================================================
const markBillPaid = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const billId = req.params.id;
    const userId = req.user.id;

    // --- Tanggal lokal (WIB) ---
    const now = new Date();
    const today = toLocalDateString(now);
    const currentMonth = toLocalMonthString(now);
    const startOfMonth = `${currentMonth}-01`;
    const endOfMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const endOfMonth = toLocalDateString(endOfMonthDate);

    // =====================================================
    // Step 1: Validasi bill exists & milik user (dengan row lock)
    // =====================================================
    const [bills] = await connection.query(
      `SELECT rb.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
       FROM recurring_bills rb
       LEFT JOIN categories c ON rb.category_id = c.id
       WHERE rb.id = ? AND rb.user_id = ?
       FOR UPDATE`,
      [billId, userId]
    );

    if (bills.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Tagihan tidak ditemukan.',
      });
    }

    const bill = bills[0];

    // =====================================================
    // Step 2: Validasi bill aktif
    // =====================================================
    if (!bill.is_active) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Tagihan sudah dinonaktifkan. Aktifkan kembali untuk membayar.',
      });
    }

    // =====================================================
    // Step 3: Validasi belum dibayar bulan ini
    // =====================================================
    const lastPaidMonth = bill.last_paid_date
      ? toLocalMonthString(new Date(bill.last_paid_date))
      : null;

    if (lastPaidMonth === currentMonth) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Tagihan bulan ini sudah dibayar.',
      });
    }

    // =====================================================
    // Step 4: Hitung saldo user saat ini
    // Sama dengan formula dashboard: monthly_allowance + income - expense
    // =====================================================
    const [users] = await connection.query(
      'SELECT monthly_allowance FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan.',
      });
    }

    const monthlyAllowance = parseFloat(users[0].monthly_allowance || 0);
    const billAmount = parseFloat(bill.amount);

    const [[incomeResult]] = await connection.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM transactions
       WHERE user_id = ? AND type = 'income' AND transaction_date BETWEEN ? AND ?`,
      [userId, startOfMonth, endOfMonth]
    );
    const totalIncome = parseFloat(incomeResult.total);

    const [[expenseResult]] = await connection.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM transactions
       WHERE user_id = ? AND type = 'expense' AND transaction_date BETWEEN ? AND ?`,
      [userId, startOfMonth, endOfMonth]
    );
    const totalExpense = parseFloat(expenseResult.total);

    const currentBalance = monthlyAllowance + totalIncome - totalExpense;

    // =====================================================
    // Step 5: Validasi saldo mencukupi
    // =====================================================
    if (currentBalance < billAmount) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Saldo tidak mencukupi. Saldo saat ini ${formatRupiah(currentBalance)}, nominal tagihan ${formatRupiah(billAmount)}. Kekurangan ${formatRupiah(billAmount - currentBalance)}.`,
        data: {
          current_balance: currentBalance,
          bill_amount: billAmount,
          shortfall: billAmount - currentBalance,
        },
      });
    }

    // =====================================================
    // Step 6: Buat transaksi expense otomatis
    // Kategori default: "Tagihan & Utilitas" (id=5) jika bill tanpa kategori
    // =====================================================
    const categoryId = bill.category_id || 5;
    const description = `Pembayaran: ${bill.name}`;

    const [transactionResult] = await connection.query(
      `INSERT INTO transactions (user_id, category_id, type, amount, description, transaction_date)
       VALUES (?, ?, 'expense', ?, ?, ?)`,
      [userId, categoryId, billAmount, description, today]
    );

    // =====================================================
    // Step 7: Update status bill = PAID
    // =====================================================
    await connection.query(
      'UPDATE recurring_bills SET last_paid_date = ? WHERE id = ?',
      [today, billId]
    );

    // =====================================================
    // Step 8: Ambil data transaksi yang baru dibuat (dengan info kategori)
    // =====================================================
    const [newTransaction] = await connection.query(
      `SELECT t.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.id = ?`,
      [transactionResult.insertId]
    );

    // =====================================================
    // Step 9: Hitung saldo setelah pembayaran
    // =====================================================
    const newBalance = currentBalance - billAmount;

    // =====================================================
    // COMMIT — semua operasi berhasil
    // =====================================================
    await connection.commit();

    res.json({
      success: true,
      message: `Tagihan "${bill.name}" sebesar ${formatRupiah(billAmount)} berhasil dibayar!`,
      data: {
        bill: {
          ...bill,
          last_paid_date: today,
          due_status: 'paid',
          is_paid_this_month: true,
        },
        transaction: newTransaction[0] || null,
        balance: {
          previous: currentBalance,
          deducted: billAmount,
          current: newBalance,
          monthly_allowance: monthlyAllowance,
          total_income: totalIncome,
          total_expense: totalExpense + billAmount,
        },
      },
    });

  } catch (error) {
    // ROLLBACK — ada yang gagal, batalkan semua
    try {
      await connection.rollback();
    } catch (rollbackErr) {
      console.error('Rollback error:', rollbackErr.message);
    }
    next(error);
  } finally {
    connection.release();
  }
};

// =====================================================
// DELETE — Hapus tagihan
// =====================================================
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