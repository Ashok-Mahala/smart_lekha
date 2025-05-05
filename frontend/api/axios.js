import axios from 'axios';
import { toast } from 'sonner';
import { API_CONFIG } from './config.js';
import { getToken, setToken, removeToken } from '../utils/auth';

// Create axios instance
const api = axios.create(API_CONFIG);

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Call refresh token endpoint
        const response = await api.post('/api/auth/refresh-token');
        const { token } = response.data;

        // Update token in storage
        setToken(token);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh token fails, logout user
        removeToken();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    const errorResponse = {
      success: false,
      error: {
        code: error.response?.data?.error?.code || 'UNKNOWN_ERROR',
        message: error.response?.data?.error?.message || 'An unexpected error occurred',
        details: error.response?.data?.error?.details || []
      }
    };

    return Promise.reject(errorResponse);
  }
);

// Add request timeout handling
api.interceptors.request.use(
  (config) => {
    config.timeout = API_CONFIG.timeout;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper function to handle API responses
export const handleApiResponse = (response) => {
  if (response.status >= 200 && response.status < 300) {
    return response.data;
  }
  throw new Error(response.data?.message || 'API request failed');
};

export default api; 