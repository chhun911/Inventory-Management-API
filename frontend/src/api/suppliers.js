import apiClient from './client';

export const suppliersApi = {
  list: () => apiClient.get('/suppliers').then((r) => r.data),
  get: (id) => apiClient.get(`/suppliers/${id}`).then((r) => r.data),
  create: (payload) => apiClient.post('/suppliers', payload).then((r) => r.data),
  update: (id, payload) => apiClient.put(`/suppliers/${id}`, payload).then((r) => r.data),
  remove: (id) => apiClient.delete(`/suppliers/${id}`).then((r) => r.data),
};
