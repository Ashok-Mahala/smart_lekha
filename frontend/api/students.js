import axios from './axios';
import { API_CONFIG } from './config';
import { toast } from 'sonner';
import PropTypes from 'prop-types';

const API_BASE_URL = `${API_CONFIG.baseURL}/students`;

export const studentPropTypes = PropTypes.shape({
  _id: PropTypes.string.isRequired,
  firstName: PropTypes.string.isRequired,
  lastName: PropTypes.string,
  email: PropTypes.string.isRequired,
  phone: PropTypes.string.isRequired,
  institution: PropTypes.string,
  course: PropTypes.string,
  aadharNumber: PropTypes.string, // Changed from number to string
  status: PropTypes.string.isRequired,
  currentAssignments: PropTypes.array, // Added for new structure
  assignmentHistory: PropTypes.array, // Added for new structure
  documents: PropTypes.array, // Added for new structure
  notes: PropTypes.string
});

export const getStudentsByProperty = async (propertyId, params = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/property/${propertyId}`, { params });
    return response.data;
  } catch (error) {
    toast.error('Failed to fetch students');
    throw error;
  }
};

export const getDocumentUrl = (relativePath) => {
  if (!relativePath) return '/placeholder.svg';
  const base = API_CONFIG.baseURL.replace(/\/$/, '');
  return `${base}${relativePath}`;
};

export const getStudentStatsByProperty = async (propertyId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/stats/student-stats`, { params: { propertyId } });
    return response.data;
  } catch (error) {
    toast.error('Failed to fetch student stats');
    throw error;
  }
};

export const getStudentById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    toast.error('Failed to fetch student');
    throw error;
  }
};

export const createStudent = async (studentData, config = {}) => {
  try {
    const isFormData = studentData instanceof FormData;
    const response = await axios.post(API_BASE_URL, studentData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
      ...config
    });
    toast.success('Student created successfully');
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to create student';
    toast.error(errorMessage);
    throw error;
  }
};

export const updateStudent = async (id, studentData, config = {}) => {
  try {
    const isFormData = studentData instanceof FormData;
    const response = await axios.put(`${API_BASE_URL}/${id}`, studentData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
      ...config
    });
    toast.success('Student updated successfully');
    return response.data;
  } catch (error) {
    toast.error('Failed to update student');
    throw error;
  }
};

export const deleteStudent = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/${id}`);
    toast.success('Student deleted successfully');
    return response.data;
  } catch (error) {
    toast.error('Failed to delete student');
    throw error;
  }
};

// New functions for assignment history
export const getStudentCurrentAssignments = async (studentId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${studentId}/assignments/current`);
    return response.data;
  } catch (error) {
    toast.error('Failed to fetch current assignments');
    throw error;
  }
};

export const getStudentAssignmentHistory = async (studentId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${studentId}/assignments/history`);
    return response.data;
  } catch (error) {
    toast.error('Failed to fetch assignment history');
    throw error;
  }
};

export const searchStudentsForAssignment = async (propertyId, searchQuery = '') => {
  try {
    const response = await axios.get(`${API_BASE_URL}/property/${propertyId}/search`, {
      params: { search: searchQuery }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching students:', error);
    throw error;
  }
};

export default {
  getStudentsByProperty,
  getStudentStatsByProperty,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentCurrentAssignments,
  getStudentAssignmentHistory,
  searchStudentsForAssignment
};