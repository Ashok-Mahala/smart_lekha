import PropTypes from 'prop-types';
import api from './api';
import { withErrorHandling } from '@/lib/errorHandler';

// No need to redefine API_URL here as it's already defined in api.js
// Using the API service that already has the correct configuration

export const authCredentialsPropTypes = PropTypes.shape({
  email: PropTypes.string.isRequired,
  password: PropTypes.string.isRequired
});

export const userDataPropTypes = PropTypes.shape({
  email: PropTypes.string.isRequired,
  password: PropTypes.string.isRequired,
  name: PropTypes.string,
  role: PropTypes.string
});

export const authService = {
  async signIn(email, password, options = {}) {
    return withErrorHandling(async () => {
      const response = await api.post('/auth/login', {
        email,
        password,
      });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data.user;
    }, { ...options, rethrow: true });
  },

  async signUp(email, password, name, options = {}) {
    return withErrorHandling(async () => {
      const response = await api.post('/auth/register', {
        email,
        password,
        name
      });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data.user;
    }, { ...options, rethrow: true });
  },

  async signOut(options = {}) {
    return withErrorHandling(async () => {
      try {
        const response = await api.post('/auth/logout');
        localStorage.removeItem('token');
        return response.data;
      } catch (error) {
        // If logout fails, still remove the token from localStorage
        localStorage.removeItem('token');
        throw error;
      }
    }, options);
  },

  async getCurrentUser(options = {}) {
    return withErrorHandling(async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const response = await api.get('/auth/me');
      return response.data;
    }, options);
  },

  async updateProfile(userData, options = {}) {
    return withErrorHandling(async () => {
      const response = await api.put('/auth/me', userData);
      return response.data;
    }, options);
  },

  async changePassword(currentPassword, newPassword, options = {}) {
    return withErrorHandling(async () => {
      const response = await api.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      return response.data;
    }, options);
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  }
}; 