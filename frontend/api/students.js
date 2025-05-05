// Student API Service
import { toast } from "sonner";
import { API_CONFIG } from './config';
import PropTypes from 'prop-types';
import api from './axios';
import { withErrorHandling } from '@/lib/errorHandler';

// API endpoints configuration
const API_BASE_URL = `${API_CONFIG.baseURL}/students`;

// PropTypes validation
export const studentPropTypes = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  phone: PropTypes.string.isRequired,
  fatherName: PropTypes.string,
  dateOfBirth: PropTypes.string,
  gender: PropTypes.string,
  studentId: PropTypes.string,
  admissionDate: PropTypes.string,
  course: PropTypes.string,
  status: PropTypes.string.isRequired,
  address: PropTypes.string,
  city: PropTypes.string,
  state: PropTypes.string,
  pincode: PropTypes.string,
  idProofType: PropTypes.string,
  idProofNumber: PropTypes.string,
  photo: PropTypes.string,
  idProofFront: PropTypes.string,
  idProofBack: PropTypes.string,
  notes: PropTypes.string
});

// Get all students
export const getAllStudents = async (params = {}, options = {}) => {
  return withErrorHandling(async () => {
    const response = await api.get(API_BASE_URL, { params });
    return response.data;
  }, options);
};

// Get student by ID
export const getStudentById = async (id, options = {}) => {
  return withErrorHandling(async () => {
    const response = await api.get(`${API_BASE_URL}/${id}`);
    return response.data;
  }, options);
};

// Create student
export const createStudent = async (studentData, options = {}) => {
  return withErrorHandling(async () => {
    // Determine if we're dealing with FormData or regular JSON
    const isFormData = studentData instanceof FormData;
    
    const response = await api.post(API_BASE_URL, studentData, {
      headers: isFormData ? {
        'Content-Type': 'multipart/form-data',
      } : undefined
    });
    
    if (options.showToast !== false) {
      toast.success('Student added successfully');
    }
    
    return response.data;
  }, { ...options, showToast: false });
};

// Update student
export const updateStudent = async (id, studentData, options = {}) => {
  return withErrorHandling(async () => {
    // Determine if we're dealing with FormData or regular JSON
    const isFormData = studentData instanceof FormData;
    
    const response = await api.put(`${API_BASE_URL}/${id}`, studentData, {
      headers: isFormData ? {
        'Content-Type': 'multipart/form-data',
      } : undefined
    });
    
    if (options.showToast !== false) {
      toast.success('Student updated successfully');
    }
    
    return response.data;
  }, { ...options, showToast: false });
};

// Delete student
export const deleteStudent = async (id, options = {}) => {
  return withErrorHandling(async () => {
    const response = await api.delete(`${API_BASE_URL}/${id}`);
    
    if (options.showToast !== false) {
      toast.success('Student deleted successfully');
    }
    
    return response.data;
  }, { ...options, showToast: false });
};

export const fetchStudents = async () => {
  try {
    const response = await fetch('/api/students');
    
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('API endpoint not available');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching students:', error);
    return [];
  }
};

export const fetchStudentStats = async () => {
  try {
    const response = await fetch('/api/students/stats');
    
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('API endpoint not available');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching student stats:', error);
    return {
      total: 0,
      active: 0,
      inactive: 0,
      male: 0,
      female: 0,
      other: 0,
    };
  }
};

export const addStudent = async (studentData) => {
  try {
    const response = await fetch('/api/students', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(studentData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to add student');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding student:', error);
    throw error;
  }
};

export const fetchOldStudents = async () => {
  try {
    const response = await fetch('/api/students/old');
    
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('API endpoint not available');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching old students:', error);
    return [];
  }
};

export const reactivateStudent = async (studentId) => {
  try {
    const response = await fetch(`/api/students/${studentId}/reactivate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to reactivate student');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error reactivating student:', error);
    throw error;
  }
};

export const searchStudents = async (query, options = {}) => {
  return withErrorHandling(async () => {
    const response = await api.get(`${API_BASE_URL}/search`, {
      params: { query }
    });
    return response.data;
  }, options);
};

export const getStudentAttendance = async (id, params = {}, options = {}) => {
  return withErrorHandling(async () => {
    const response = await api.get(`${API_BASE_URL}/${id}/attendance`, { params });
    return response.data;
  }, options);
};

export const getStudentPayments = async (id, params = {}, options = {}) => {
  return withErrorHandling(async () => {
    const response = await api.get(`${API_BASE_URL}/${id}/payments`, { params });
    return response.data;
  }, options);
};

export const updateStudentStatus = async (id, status, options = {}) => {
  return withErrorHandling(async () => {
    const response = await api.put(`${API_BASE_URL}/${id}/status`, { status });
    
    if (options.showToast !== false) {
      toast.success(`Student status updated to ${status}`);
    }
    
    return response.data;
  }, { ...options, showToast: false });
};

export const getStudentStats = async (options = {}) => {
  return withErrorHandling(async () => {
    const response = await api.get(`${API_BASE_URL}/stats`);
    return response.data;
  }, options);
};

export default {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  updateStudentStatus,
  getStudentAttendance,
  getStudentPayments,
  searchStudents,
  getStudentStats
};