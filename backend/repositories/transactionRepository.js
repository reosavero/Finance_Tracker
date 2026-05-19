// =====================================================
// repositories/transactionRepository.js
// Query database untuk transaksi
// =====================================================
const { pool } = require('../config/db');

const escapeLikeKeyword = (value = '') =>
  String(value).replace(/[\\%_]/g, (char) => `\\${char}`);

const buildTransactionFilters = ({
  userId,
  type,
  category_id,
  start_date,
  end_date,
  search,
}) => {
  let whereClause = 'WHERE t.user_id = ?';
  const params = [userId];

  if (type) {
    whereClause += ' AND t.type = ?';
    params.push(type);
  }

  if (category_id) {
    whereClause += ' AND t.category_id = ?';
    params.push(category_id);
  }

  if (start_date) {
    whereClause += ' AND t.transaction_date >= ?';
    params.push(start_date);
  }

  if (end_date) {
    whereClause += ' AND t.transaction_date <= ?';
    params.push(end_date);
  }

  if (search) {
    const keyword = `%${escapeLikeKeyword(search)}%`;

    // Project saat ini belum memiliki kolom title di tabel transactions.
    // Nama transaksi yang tersedia di UI/data adalah category_name, sedangkan
    // detail transaksi tersimpan di description. Jika nanti kolom title ditambah,
    // cukup tambahkan: OR LOWER(t.title) LIKE LOWER(?)
    // Backslash tetap dipakai di parameter untuk escape wildcard %, _, dan \\.
    // Klausa ESCAPE sengaja tidak dipakai agar kompatibel dengan MariaDB/MySQL mode.
    whereClause += `
      AND (
        LOWER(c.name) LIKE LOWER(?)
        OR LOWER(t.description) LIKE LOWER(?)
      )
    `;
    params.push(keyword, keyword);
  }

  return { whereClause, params };
};

const findTransactions = async ({
  userId,
  type,
  category_id,
  start_date,
  end_date,
  search,
  page,
  limit,
}) => {
  const { whereClause, params } = buildTransactionFilters({
    userId,
    type,
    category_id,
    start_date,
    end_date,
    search,
  });

  const offset = (page - 1) * limit;

  const dataQuery = `
    SELECT t.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    ${whereClause}
    ORDER BY t.transaction_date DESC, t.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    ${whereClause}
  `;

  const [transactions] = await pool.query(dataQuery, [...params, limit, offset]);
  const [countResult] = await pool.query(countQuery, params);

  return {
    transactions,
    total: Number(countResult[0]?.total || 0),
  };
};

module.exports = {
  findTransactions,
};
