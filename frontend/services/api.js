import PropTypes from 'prop-types';
import axios from 'axios';
import { getToken, setToken, removeToken } from '../utils/auth';
import { 
  ApiError, 
  ERROR_CODES, 
  HTTP_STATUS_TO_ERROR_CODE,
  withErrorHandling
} from '@/lib/errorHandler';

// Get API URL from environment variables with a fallback
// const API_URL = import.meta.env.VITE_API_URL || 'http://10.242.95.105:5000/smlekha';
const API_URL = 'http://10.242.95.105:5000/smlekha';

// Log the API URL being used (helpful for debugging)
//console.log('API URL:', API_URL);

// Axios timeout configuration (10 seconds)
const TIMEOUT = 10000;

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // ADD THIS - Important for cookies
  timeout: TIMEOUT,
});

export const userDataPropTypes = PropTypes.shape({
  email: PropTypes.string.isRequired,
  password: PropTypes.string.isRequired,
  name: PropTypes.string,
  role: PropTypes.string
});

export const seatDataPropTypes = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  price: PropTypes.number.isRequired,
  description: PropTypes.string
});

export const bookingDataPropTypes = PropTypes.shape({
  id: PropTypes.string.isRequired,
  seatId: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
  startTime: PropTypes.string.isRequired,
  endTime: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
  price: PropTypes.number.isRequired
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }else {
      console.warn('No token available for secured request');
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      
      // Don't redirect if on login or registration page
      const currentPath = window.location.pathname;
      if (!['/login', '/signup', '/register'].includes(currentPath)) {
        window.location.href = '/login';
      }
      
      // Convert to ApiError
      const code = ERROR_CODES.UNAUTHORIZED;
      return Promise.reject(
        new ApiError(
          code, 
          error.response.data?.message || 'Your session has expired, please login again', 
          error.response.data?.details,
          401
        )
      );
    }
    
    // For other errors, just reject with the original error
    // The handleApiError utility will transform it into an ApiError when used
    return Promise.reject(error);
  }
);

export const apiService = {
  auth: {
    login: async (email, password, options = {}) => {
        const response = await api.post('/auth/login', { email, password });
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
        return response.data;
    },

    register: async (userData, options = {}) => {
        const response = await api.post('/auth/register', userData);
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
        return response.data;
    },

    getProfile: async (options = {}) => {
        const response = await api.get('/auth/me');
        return response.data;
    },

    updateProfile: async (userData, options = {}) => {
        const response = await api.put('/auth/me', userData);
        return response.data;
    },

    changePassword: async (currentPassword, newPassword, options = {}) => {
        const response = await api.put('/auth/change-password', { currentPassword, newPassword });
        return response.data;
    }
  },

  seats: {
    getAllSeats: async (params, options = {}) => {
        const response = await api.get('/seats', { params });
        return response.data;
    },

    getSeatById: async (id, options = {}) => {
        const response = await api.get(`/seats/${id}`);
        return response.data;
    },

    createSeat: async (seatData, options = {}) => {
        const response = await api.post('/seats', seatData);
        return response.data;
    },

    updateSeat: async (id, seatData, options = {}) => {
        const response = await api.put(`/seats/${id}`, seatData);
        return response.data;
    },

    deleteSeat: async (id, options = {}) => {
        const response = await api.delete(`/seats/${id}`);
        return response.data;
    },

    getSeatAvailability: async (id, startTime, endTime, options = {}) => {
        const response = await api.get(`/seats/${id}/availability`, {
          params: { startTime, endTime }
        });
        return response.data;
    },

    updateSeatStatus: async (id, status, options = {}) => {
        const response = await api.put(`/seats/${id}/status`, { status });
        return response.data;
    }
  },

  bookings: {
    createBooking: async (bookingData, options = {}) => {
        const response = await api.post('/bookings', bookingData);
        return response.data;
    },

    getAllBookings: async (params, options = {}) => {
        const response = await api.get('/bookings', { params });
        return response.data;
    },

    getBookingById: async (id, options = {}) => {
        const response = await api.get(`/bookings/${id}`);
        return response.data;
    },

    getUserBookings: async (params, options = {}) => {
        const response = await api.get('/bookings/user', { params });
        return response.data;
    },

    updateBookingStatus: async (id, status, options = {}) => {
        const response = await api.put(`/bookings/${id}/status`, { status });
        return response.data;
    },

    cancelBooking: async (id, options = {}) => {
        const response = await api.post(`/bookings/${id}/cancel`);
        return response.data;
    }
  },

  students: {
    getStudents: async (params, options = {}) => {
        const response = await api.get('/students', { params });
        return response.data;
    },

    getStudentById: async (id, options = {}) => {
        const response = await api.get(`/students/${id}`);
        return response.data;
    },

    createStudent: async (studentData, options = {}) => {
        const response = await api.post('/students', studentData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data;
    },

    updateStudent: async (id, studentData, options = {}) => {
        const response = await api.put(`/students/${id}`, studentData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data;
    },

    deleteStudent: async (id, options = {}) => {
        const response = await api.delete(`/students/${id}`);
        return response.data;
    },

    updateStudentStatus: async (id, status, options = {}) => {
        const response = await api.put(`/students/${id}/status`, { status });
        return response.data;
    }
  }
};

export default api; 