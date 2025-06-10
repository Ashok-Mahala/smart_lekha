import PropTypes from 'prop-types';
import api from './api';
import { withErrorHandling } from '@/lib/errorHandler';

export const authCredentialsPropTypes = PropTypes.shape({
  email: PropTypes.string.isRequired,
  password: PropTypes.string.isRequired,
});

export const userDataPropTypes = PropTypes.shape({
  email: PropTypes.string.isRequired,
  password: PropTypes.string.isRequired,
  name: PropTypes.string,
  role: PropTypes.string,
});

export const authService = {
  async signIn(email, password, options = {}) {
      console.log("Login Function Call");
      const response = await api.post('/auth/login', { email, password });
      console.log("response",response);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userid', response.data.user.id);
      }
      return response.data.user;
  },
    
  async signUp(email, password, name, options = {}) {
    if (!email || !password || !name) {
      throw new Error('Email, password, and name are required for registration');
    }

    if (typeof email !== 'string' || typeof password !== 'string' || typeof name !== 'string') {
      throw new Error('Email, password, and name must be strings');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Invalid email format');
    }

    const response = await api.post('/auth/register', {
      email,
      password,
      firstName: name,
      lastName: name, // Assuming lastName is optional
    });

    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }

    return response.data.user;
  },

  async signOut(options = {}) {
      const token = localStorage.getItem('token'); // Get token before removing
      localStorage.removeItem('token'); // Remove immediately for UI

      try {
        const response = await api.post('/auth/logout', {}, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        return response.data;
      } catch (error) {
        console.error('Logout error:', error);
        throw error;
      }
  },

  async getCurrentUser(options = {}) {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const response = await api.get('/auth/me');
      return response.data;
  },

  async updateProfile(userData, options = {}) {
      const response = await api.put('/auth/me', userData);
      return response.data;
  },

  async changePassword(currentPassword, newPassword, options = {}) {
      const response = await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      return response.data;
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  },
};
