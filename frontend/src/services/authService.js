import api from './api';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

const clearLegacyLocalStorage = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

const authService = {
  getToken: () => sessionStorage.getItem(TOKEN_KEY),

  getStoredUser: () => {
    const rawUser = sessionStorage.getItem(USER_KEY);
    if (!rawUser) return null;

    try {
      return JSON.parse(rawUser);
    } catch (error) {
      sessionStorage.removeItem(USER_KEY);
      return null;
    }
  },

  setSession: ({ token, user }) => {
    clearLegacyLocalStorage();
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clearSession: () => {
    clearLegacyLocalStorage();
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  },

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, ...user } = res.data.data;
    authService.setSession({ token, user });
    return { ...res.data, data: { ...user, token } };
  },

  register: async (payload) => {
    const res = await api.post('/auth/register', payload);
    const { token, ...user } = res.data.data;
    authService.setSession({ token, user });
    return { ...res.data, data: { ...user, token } };
  },

  getProfile: async () => api.get('/auth/profile'),

  updateStoredUser: (user) => {
    clearLegacyLocalStorage();
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  },
};

export default authService;
