import axios from 'axios';

const API_URL = 'https://api.vendornet.in/api/v1';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  sendOTP: (mobile) => api.post('/auth/send-otp', { mobile }),
  verifyOTP: (mobile, otp) => api.post('/auth/verify-otp', { mobile, otp })
};

export const usersAPI = {
  getAll: () => api.get('/admin/users'),
  toggleActive: (id) => api.put(`/admin/users/${id}/toggle`)
};

export const productsAPI = {
  getCategories: () => api.get('/categories'),
  getProducts: () => api.get('/products'),
  createProduct: (data) => api.post('/products', data),
  createVariant: (productId, data) => api.post(`/products/${productId}/variants`, data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  getVariants: (productId) => api.get(`/products/${productId}/variants`),
  updateVariant: (id, data) => api.put(`/variants/${id}`, data),
};

export const ordersAPI = {
  getAll: () => api.get('/admin/orders'),
  getCommission: () => api.get('/admin/commission')
};

export default api;