import PropTypes from 'prop-types';
import axios from 'axios';
import { 
  ApiError, 
  ERROR_CODES, 
  HTTP_STATUS_TO_ERROR_CODE,
  withErrorHandling
} from '@/lib/errorHandler';

// Get API URL from environment variables with a fallback
// const API_URL = import.meta.env.VITE_API_URL || 'http://62.72.58.243:5000/api';
const API_URL = 'http://62.72.58.243:5000/api';
// Log the API URL being used (helpful for debugging)
console.log('API URL:', API_URL);

// Axios timeout configuration (10 seconds)
const TIMEOUT = 10000;

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
      return withErrorHandling(async () => {
        const response = await api.post('/auth/login', { email, password });
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
        return response.data;
      }, { ...options, rethrow: true }); // rethrow so login failures can be handled by the form
    },

    register: async (userData, options = {}) => {
      return withErrorHandling(async () => {
        const response = await api.post('/auth/register', userData);
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
        return response.data;
      }, { ...options, rethrow: true });
    },

    getProfile: async (options = {}) => {
      return withErrorHandling(async () => {
        const response = await api.get('/auth/me');
        return response.data;
      }, options);
    },

    updateProfile: async (userData, options = {}) => {
      return withErrorHandling(async () => {
        const response = await api.put('/auth/me', userData);
        return response.data;
      }, options);
    },

    changePassword: async (currentPassword, newPassword, options = {}) => {
      return withErrorHandling(async () => {
        const response = await api.put('/auth/change-password', { currentPassword, newPassword });
        return response.data;
      }, options);
    }
  },

  seats: {
    getAllSeats: async (params, options = {}) => {
      return withErrorHandling(async () => {
        const response = await api.get('/seats', { params });
        return response.data;
      }, options);
    },

    getSeatById: async (id, options = {}) => {
      return withErrorHandling(async () => {
        const response = await api.get(`/seats/${id}`);
        return response.data;
      }, options);
    },

    createSeat: async (seatData, options = {}) => {
      return withErrorHandling(async () => {
        const response = await api.post('/seats', seatData);
        return response.data;
      }, options);
    },

    updateSeat: async (id, seatData, options = {}) => {
      return withErrorHandling(async () => {
        const response = await api.put(`/seats/${id}`, seatData);
        return response.data;
      }, options);
    },

    deleteSeat: async (id, options = {}) => {
      return withErrorHandling(async () => {
        const response = await api.delete(`/seats/${id}`);
        return response.data;
      }, options);
    },

    getSeatAvailability: async (id, startTime, endTime, options = {}) => {
      return withErrorHandling(async () => {
        const response = await api.get(`/seats/${id}/availability`, {
          params: { startTime, endTime }
        });
        return response.data;
      }, options);
    },

    updateSeatStatus: async (id, status, options = {}) => {
      return withErrorHandling(async () => {
        const response = await api.put(`/seats/${id}/status`, { status });
        return response.data;
      }, options);
    }
  },

  bookings: {
    createBooking: async (bookingData, options = {}) => {
      return withErrorHandling(async () => {
        const response = await api.post('/bookings', bookingData);
        return response.data;
      }, options);
    },

    getAllBookings: async (params, options = {}) => {
      return withErrorHandling(async () => {
        const response = await api.get('/bookings', { params });
        return response.data;
      }, options);
    },

    getBookingById: async (id, options = {}) => {
      return withErrorHandling(async () => {
        const response = await api.get(`/bookings/${id}`);
        return response.data;
      }, options);
    },

    getUserBookings: async (params, options = {}) => {
      return withErrorHandling(async () => {
        const response = await api.get('/bookings/user', { params });
        return response.data;
      }, options);
    },

    updateBookingStatus: async (id, status, options = {}) => {
      return withErrorHandling(async () => {
        const response = await api.put(`/bookings/${id}/status`, { status });
        return response.data;
      }, options);
    },

    cancelBooking: async (id, options = {}) => {
      return withErrorHandling(async () => {
        const response = await api.post(`/bookings/${id}/cancel`);
        return response.data;
      }, options);
    }
  },

  students: {
    getStudents: async (params, options = {}) => {
      return withErrorHandling(async () => {
        const response = await api.get('/students', { params });
        return response.data;
      }, options);
    },

    getStudentById: async (id, options = {}) => {
      return withErrorHandling(async () => {
        const response = await api.get(`/students/${id}`);
        return response.data;
      }, options);
    },

    createStudent: async (studentData, options = {}) => {
      return withErrorHandling(async () => {
        const response = await api.post('/students', studentData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data;
      }, options);
    },

    updateStudent: async (id, studentData, options = {}) => {
      return withErrorHandling(async () => {
        const response = await api.put(`/students/${id}`, studentData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data;
      }, options);
    },

    deleteStudent: async (id, options = {}) => {
      return withErrorHandling(async () => {
        const response = await api.delete(`/students/${id}`);
        return response.data;
      }, options);
    },

    updateStudentStatus: async (id, status, options = {}) => {
      return withErrorHandling(async () => {
        const response = await api.put(`/students/${id}/status`, { status });
        return response.data;
      }, options);
    }
  }
};

export default api; 