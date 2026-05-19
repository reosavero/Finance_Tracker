import api from './api';

const billService = {
  getBills: () => api.get('/bills'),

  createBill: (payload) => api.post('/bills', payload),

  updateBill: (id, payload) => api.put(`/bills/${id}`, payload),

  markBillPaid: (id) => api.put(`/bills/${id}/pay`),

  deleteBill: (id) => api.delete(`/bills/${id}`),
};

export default billService;
