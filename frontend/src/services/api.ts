import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_GATEWAY_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (data: { email: string; password: string; full_name: string; phone?: string }) =>
    api.post('/api/auth/register', data),
  
  login: (data: { email: string; password: string }) =>
    api.post('/api/auth/login', data),
  
  getProfile: () =>
    api.get('/api/auth/profile'),
  
  updateProfile: (data: { full_name: string; phone: string }) =>
    api.put('/api/auth/profile', data),
  
  getAddresses: () =>
    api.get('/api/auth/addresses'),
  
  addAddress: (data: any) =>
    api.post('/api/auth/addresses', data),
};

// Product API
export const productAPI = {
  getProducts: (params?: any) =>
    api.get('/api/products/products', { params }),
  
  getProduct: (id: number) =>
    api.get(`/api/products/products/${id}`),
  
  getCategories: () =>
    api.get('/api/products/categories'),
  
  createProduct: (data: any) =>
    api.post('/api/products/products', data),
  
  updateProduct: (id: number, data: any) =>
    api.put(`/api/products/products/${id}`, data),
  
  bulkUpload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/products/products/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Cart API
export const cartAPI = {
  getCart: () =>
    api.get('/api/cart/cart'),
  
  addToCart: (data: { product_id: number; quantity: number }) =>
    api.post('/api/cart/cart/items', data),
  
  updateCartItem: (itemId: number, data: { quantity: number }) =>
    api.put(`/api/cart/cart/items/${itemId}`, data),
  
  removeFromCart: (itemId: number) =>
    api.delete(`/api/cart/cart/items/${itemId}`),
  
  clearCart: () =>
    api.delete('/api/cart/cart'),
};

// Order API
export const orderAPI = {
  createOrder: (data: any) =>
    api.post('/api/orders/orders', data),
  
  getOrders: (params?: any) =>
    api.get('/api/orders/orders', { params }),
  
  getOrder: (id: number) =>
    api.get(`/api/orders/orders/${id}`),
  
  trackOrder: (orderNumber: string) =>
    api.get(`/api/orders/track/${orderNumber}`),
  
  cancelOrder: (id: number) =>
    api.post(`/api/orders/orders/${id}/cancel`),
};

// Discount API
export const discountAPI = {
  getDiscounts: () =>
    api.get('/api/discounts/discounts'),
  
  validateDiscount: (data: { code: string; subtotal: number }) =>
    api.post('/api/discounts/discounts/validate', data),
  
  createDiscount: (data: any) =>
    api.post('/api/discounts/discounts', data),
  
  updateDiscount: (id: number, data: any) =>
    api.put(`/api/discounts/discounts/${id}`, data),
};

// Admin API
export const adminAPI = {
  getDashboardStats: () =>
    api.get('/api/admin/dashboard/stats'),
  
  getOrders: (params?: any) =>
    api.get('/api/admin/orders', { params }),
  
  getUsers: (params?: any) =>
    api.get('/api/admin/users', { params }),
  
  updateUserStatus: (id: number, data: { is_active: boolean }) =>
    api.patch(`/api/admin/users/${id}/status`, data),
  
  getSalesAnalytics: (params?: any) =>
    api.get('/api/admin/analytics/sales', { params }),
};

export default api;
