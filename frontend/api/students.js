// @/api/students.js
import axios from './axios';
import { API_CONFIG } from './config';
import { toast } from 'sonner';
import PropTypes from 'prop-types';

const API_BASE_URL = `${API_CONFIG.baseURL}/students`;

// PropTypes matching your Student model
export const studentPropTypes = PropTypes.shape({
  _id: PropTypes.string.isRequired,
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
  notes: PropTypes.string,
  currentSeat: PropTypes.string
});

// Get students by property ID
export const getStudentsByProperty = async (propertyId, params = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/property/${propertyId}`, { params });
    return response.data.students || [];
  } catch (error) {
    toast.error('Failed to fetch students');
    throw error;
  }
};

/**
 * Builds full URL for profile photo or identity proof
 */
export const getDocumentUrl = (relativePath) => {
  if (!relativePath) return '/placeholder.svg';
  const base = API_CONFIG.baseURL.replace(/\/$/, ''); // remove trailing slash if any
  return `${base}${relativePath}`;
};

// Get student stats by property ID
export const getStudentStats = async (propertyId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/stats`, { params: { propertyId } });
    return response.data;
  } catch (error) {
    toast.error('Failed to fetch stats');
    throw error;
  }
};

// Get student by ID
export const getStudentById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    toast.error('Failed to fetch student');
    throw error;
  }
};

// Create a new student
export const createStudent = async (studentData) => {
  try {
    const isFormData = studentData instanceof FormData;
    const response = await axios.post(API_BASE_URL, studentData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
    });
    toast.success('Student created successfully');
    return response.data;
  } catch (error) {
    toast.error('Failed to create student');
    throw error;
  }
};

// Update an existing student
export const updateStudent = async (id, studentData) => {
  try {
    const isFormData = studentData instanceof FormData;
    const response = await axios.put(`${API_BASE_URL}/${id}`, studentData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
    });
    toast.success('Student updated successfully');
    return response.data;
  } catch (error) {
    toast.error('Failed to update student');
    throw error;
  }
};

// Delete a student
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

getDocumentUrl.propTypes = {
  relativePath: PropTypes.string,
};

export default {
  getStudentsByProperty,
  getStudentStats,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
};
