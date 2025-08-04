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
  currentSeat: PropTypes.object,
  institution: PropTypes.string,
  course: PropTypes.string,
  aadharNumber: PropTypes.number,
  status: PropTypes.string.isRequired,
  booking: PropTypes.object,
  shift: PropTypes.object,
  payment: PropTypes.object
});

export const getStudentsByProperty = async (propertyId, params = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/property/${propertyId}`, { params });
    return response.data.students || [];
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

export const getStudentStats = async (propertyId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/stats`, { params: { propertyId } });
    return response.data;
  } catch (error) {
    toast.error('Failed to fetch stats');
    throw error;
  }
};

export const getStudentById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/profile/${id}`);
    return response.data;
  } catch (error) {
    toast.error('Failed to fetch student');
    throw error;
  }
};

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

export default {
  getStudentsByProperty,
  getStudentStats,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
};