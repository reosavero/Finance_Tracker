import api from './api';

const profileService = {
  getProfile: () => api.get('/auth/profile'),

  updateProfile: (payload) => api.put('/auth/profile', payload),

  uploadProfilePhoto: (file) => {
    const formData = new FormData();
    formData.append('photo', file);

    return api.put('/auth/profile/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  verifyPassword: (currentPassword) => api.post('/auth/verify-password', { currentPassword }),

  changePassword: (payload) => api.put('/auth/change-password', payload),
};

export default profileService;
