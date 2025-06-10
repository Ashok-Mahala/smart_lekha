// Shifts API Service

import axios from './axios';
import { API_CONFIG } from './config';
import { toast } from 'sonner';
import PropTypes from 'prop-types';
import { withErrorHandling } from '@/lib/errorHandler';

// API endpoints
const API_BASE_URL = `${API_CONFIG.baseURL}/shifts`;

// Get all shifts
export const getShifts = async (params = {}) => {
  try {
    const response = await axios.get(API_BASE_URL, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get shift by ID
export const getShiftById = async (id, options = {}) => {
    const response = await axios.get(`${API_BASE_URL}/${id}`);
    return response.data;
};

// Get shifts by zone
export const getZoneShifts = async (zoneId, params = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/zone/${zoneId}`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get shifts by date
export const getShiftSchedule = async (params = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/schedule`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create new shift
export const createShift = async (shiftData, options = {}) => {
    const response = await axios.post(API_BASE_URL, shiftData);
    toast.success('Shift created successfully');
    return response.data;
};

// Update shift
export const updateShift = async (id, shiftData, options = {}) => {
    const response = await axios.put(`${API_BASE_URL}/${id}`, shiftData);
    toast.success('Shift updated successfully');
    return response.data;
};

// Delete shift
export const deleteShift = async (id, options = {}) => {
    const response = await axios.delete(`${API_BASE_URL}/${id}`);
    toast.success('Shift deleted successfully');
    return response.data;
};

// Get staff shifts
export const getStaffShifts = async (staffId, params = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/staff/${staffId}`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get property shifts
export const getPropertyShifts = async (propertyId, params = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/property/${propertyId}`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update shift status
export const updateShiftStatus = async (id, status) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/${id}/status`, { status });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get shift statistics
export const getShiftStats = async (params = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/stats`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// PropTypes validation
export const shiftPropTypes = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  startTime: PropTypes.string.isRequired,
  endTime: PropTypes.string.isRequired,
  date: PropTypes.string,
  capacity: PropTypes.number.isRequired,
  zone: PropTypes.oneOf(["full-day", "half-day", "reading-area", "computer-zone", "quiet-study", "group-study"]).isRequired,
  currentOccupancy: PropTypes.number,
  staffAssigned: PropTypes.arrayOf(PropTypes.string),
  isActive: PropTypes.bool.isRequired,
});

export const fetchShifts = async () => {
  try {
    const response = await fetch('/smlekha/shifts');
    
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('API endpoint not available');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching shifts:', error);
    return [];
  }
};

export const fetchShiftStats = async () => {
  try {
    const response = await fetch('/smlekha/shifts/stats');
    
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('API endpoint not available');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching shift stats:', error);
    return {
      total: 0,
      active: 0,
      inactive: 0,
      morning: 0,
      afternoon: 0,
      evening: 0,
    };
  }
};

/**
 * Get all shifts with optional parameters
 * @param {Object} params - Query parameters
 * @param {Object} options - Request options
 * @returns {Promise<Array>} - Array of shifts
 */
export const getAllShifts = async (params = {}, options = {}) => {
    const response = await axios.get(API_BASE_URL, { params });
    return response.data;
};

/**
 * Get active shifts
 * @param {Object} options - Request options
 * @returns {Promise<Array>} - Array of active shifts
 */
export const getActiveShifts = async (options = {}) => {
    const response = await axios.get(`${API_BASE_URL}/active`);
    return response.data;
};

/**
 * Get shifts with availability information
 * @param {string} date - Date to check availability (YYYY-MM-DD)
 * @param {Object} options - Request options
 * @returns {Promise<Array>} - Array of shifts with availability info
 */
export const getShiftsAvailability = async (date, options = {}) => {
    const response = await axios.get(`${API_BASE_URL}/availability`, { 
      params: { date } 
    });
    return response.data;
};

export default {
  getAllShifts,
  getShiftById,
  createShift,
  updateShift,
  deleteShift,
  getActiveShifts,
  getShiftsAvailability
};

