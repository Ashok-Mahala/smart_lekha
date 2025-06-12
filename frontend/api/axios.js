import axios from 'axios';
import { toast } from 'sonner';
import { API_CONFIG } from './config.js';
import { getToken, setToken, removeToken } from '../utils/auth';

// Debug initial token
console.log('Initial token from storage:', getToken());

// Create axios instance
const api = axios.create({
  ...API_CONFIG,
  headers: {
    'Content-Type': 'application/json',
    // Other default headers
  }
});

// Request interceptor with enhanced debugging
api.interceptors.request.use(
  (config) => {
    console.log(`[AXIOS] Preparing request to ${config.url}`);
    console.log('Current config headers:', config.headers);
    
    const token = getToken();
    console.log('Token retrieved:', token ? '*****' : 'NULL');
    
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`
      };
      console.log('Updated headers with auth:', config.headers);
    } else {
      console.warn('No token available for secured request');
    }
    
    return config;
  },
  (error) => {
    console.error('[AXIOS] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with enhanced debugging
api.interceptors.response.use(
  (response) => {
    console.log(`[AXIOS] Response from ${response.config.url}:`, response.status);
    return response;
  },
  async (error) => {
    console.error('[AXIOS] Response error:', error);
    
    const originalRequest = error.config;
    console.log('Original request:', originalRequest.url);

    // Handle token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('Attempting token refresh...');
      originalRequest._retry = true;

      try {
        const response = await api.post('/smlekha/auth/refresh-token');
        const { token } = response.data;
        console.log('New token received:', token ? '*****' : 'NULL');

        setToken(token);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        
        console.log('Retrying original request with new token');
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        removeToken();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Format error response
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

export default api;