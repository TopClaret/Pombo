import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Interceptor para adicionar token às requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (name: string, email: string, password: string) =>
    api.post('/auth/register', { name, email, password }),
  
  getProfile: () =>
    api.get('/auth/profile'),
  
  updateProfile: (data: { name?: string; email?: string }) =>
    api.put('/auth/profile', data),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/change-password', { currentPassword, newPassword }),
};

export const uploadAPI = {
  uploadFiles: (formData: FormData) =>
    api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  getUserUploads: (params?: { page?: number; limit?: number; status?: string; fileType?: string }) =>
    api.get('/upload', { params }),
  
  getUploadDetails: (id: string) =>
    api.get(`/upload/${id}`),
  
  deleteUpload: (id: string) =>
    api.delete(`/upload/${id}`),
};

export const analysisAPI = {
  getUploadAnalysis: (uploadId: string) =>
    api.get(`/analysis/upload/${uploadId}`),
  
  getAnalysisStats: () =>
    api.get('/analysis/stats'),
};

export const dashboardAPI = {
  getStats: () =>
    api.get('/dashboard/stats'),
  
  getRecentActivities: () =>
    api.get('/dashboard/recent-activities'),
};

export default api;