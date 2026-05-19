import api from './api';

const budgetService = {
  getBudgets: (params = {}) => api.get('/budgets', { params }),

  createBudget: (payload) => api.post('/budgets', payload),

  updateBudget: (id, payload) => api.put(`/budgets/${id}`, payload),

  deleteBudget: (id) => api.delete(`/budgets/${id}`),
};

export default budgetService;
