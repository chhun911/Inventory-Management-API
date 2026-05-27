import { defineStore } from 'pinia';
import apiClient, { extractErrorMessage } from '../api/client';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,
    user: null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
  },
  actions: {
    hydrate() {
      const token = localStorage.getItem('auth_token');
      const userRaw = localStorage.getItem('auth_user');
      if (token) this.token = token;
      if (userRaw) {
        try { this.user = JSON.parse(userRaw); } catch { this.user = null; }
      }
    },
    persist() {
      if (this.token) localStorage.setItem('auth_token', this.token);
      else localStorage.removeItem('auth_token');
      if (this.user) localStorage.setItem('auth_user', JSON.stringify(this.user));
      else localStorage.removeItem('auth_user');
    },
    async login(email, password) {
      try {
        const { data } = await apiClient.post('/auth/login', { email, password });
        this.token = data.accessToken;
        this.user = data.user;
        this.persist();
        return { ok: true };
      } catch (error) {
        return { ok: false, error: extractErrorMessage(error, 'Login failed') };
      }
    },
    async register(email, password, name) {
      try {
        const { data } = await apiClient.post('/auth/register', { email, password, name });
        this.token = data.accessToken;
        this.user = data.user;
        this.persist();
        return { ok: true };
      } catch (error) {
        return { ok: false, error: extractErrorMessage(error, 'Registration failed') };
      }
    },
    logout() {
      this.token = null;
      this.user = null;
      this.persist();
    },
  },
});
