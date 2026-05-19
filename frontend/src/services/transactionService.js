import api from './api';

const transactionService = {
  getTransactions: (params = {}) => api.get('/transactions', { params }),

  updateTransaction: (id, payload) => api.put(`/transactions/${id}`, payload),

  deleteTransaction: (id) => api.delete(`/transactions/${id}`),
};

export default transactionService;
