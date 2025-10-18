import axios from 'axios';
import { toast } from 'sonner';
import { API_CONFIG } from './config.js';
import { getToken, setToken, removeToken } from '../utils/auth';
import { authService } from '@/services/authService';

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

// Response interceptor - FIXED VERSION
api.interceptors.response.use(
  (response) => {
    console.log(`[AXIOS] Response from ${response.config.url}:`, response.status);
    return response;
  },
  async (error) => {
    console.error('[AXIOS] Response error:', {
      status: error.response?.status,
      message: error.response?.data?.message,
      url: error.config?.url
    });

    const originalRequest = error.config;

    // Handle both 401 AND 500 errors that are actually auth errors
    const isAuthError = error.response?.status === 401 || 
                       (error.response?.status === 500 && 
                        error.response?.data?.message?.includes('authorized'));

    if (isAuthError && originalRequest && !originalRequest._retry) {
      console.log('🔄 Authentication error detected, attempting token refresh...');
      originalRequest._retry = true;

      try {
        // Call refresh token endpoint
        const refreshResponse = await api.post('/auth/refresh-token', {}, {
          withCredentials: true // Important for cookies
        });
        
        const { accessToken } = refreshResponse.data;
        console.log('✅ New access token received');

        // Update token in storage and headers
        setToken(accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        console.log('🔄 Retrying original request:', originalRequest.url);
        return api(originalRequest);
        
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        
        // Clear tokens and redirect to login
        removeToken();
        localStorage.removeItem('user');
        
        // Only redirect if not already on auth pages
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
          await authService.signOut();
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }

    // For other errors, just reject
    return Promise.reject(error);
  }
);

export default api;