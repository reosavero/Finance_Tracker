// =====================================================
// services/transactionService.js
// Business logic transaksi
// =====================================================
const transactionRepository = require('../repositories/transactionRepository');

const MAX_LIMIT = 100;

const toPositiveInteger = (value, fallback) => {
  const number = Number.parseInt(value, 10);
  return Number.isInteger(number) && number > 0 ? number : fallback;
};

const validateGetTransactionsQuery = (query) => {
  const errors = [];
  const {
    type,
    category_id,
    start_date,
    end_date,
    search = '',
  } = query;

  if (type && !['expense', 'income'].includes(type)) {
    errors.push('Type harus "expense" atau "income".');
  }

  if (category_id && !Number.isInteger(Number(category_id))) {
    errors.push('category_id harus berupa angka.');
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (start_date && !dateRegex.test(start_date)) {
    errors.push('start_date harus berformat YYYY-MM-DD.');
  }

  if (end_date && !dateRegex.test(end_date)) {
    errors.push('end_date harus berformat YYYY-MM-DD.');
  }

  if (start_date && end_date && start_date > end_date) {
    errors.push('start_date tidak boleh lebih besar dari end_date.');
  }

  if (typeof search !== 'string') {
    errors.push('search harus berupa teks.');
  }

  if (String(search).length > 100) {
    errors.push('search maksimal 100 karakter.');
  }

  if (errors.length > 0) {
    const error = new Error(errors.join(' '));
    error.status = 400;
    throw error;
  }
};

const getTransactions = async (userId, query) => {
  validateGetTransactionsQuery(query);

  const page = toPositiveInteger(query.page, 1);
  const requestedLimit = toPositiveInteger(query.limit, 20);
  const limit = Math.min(requestedLimit, MAX_LIMIT);
  const search = String(query.search || '').trim();

  const { transactions, total } = await transactionRepository.findTransactions({
    userId,
    type: query.type || null,
    category_id: query.category_id || null,
    start_date: query.start_date || null,
    end_date: query.end_date || null,
    search: search || null,
    page,
    limit,
  });

  return {
    data: transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

module.exports = {
  getTransactions,
};
