import axios from './axios';
import { API_CONFIG } from './config';
import { toast } from 'sonner';
import PropTypes from 'prop-types';
import { withErrorHandling } from '@/lib/errorHandler';

// API endpoints
const API_BASE_URL = `${API_CONFIG.baseURL}/seats`;

// PropTypes validation
export const seatPropTypes = PropTypes.shape({
  id: PropTypes.string.isRequired,
  seatNumber: PropTypes.string.isRequired,
  section: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
  price: PropTypes.number.isRequired,
  features: PropTypes.arrayOf(PropTypes.string),
  description: PropTypes.string,
});

/**
 * Get all seats with optional parameters
 * @param {Object} params - Query parameters
 * @param {Object} options - Request options
 * @returns {Promise<Array>} - Array of seats
 */
export const getAllSeats = async (params = {}, options = {}) => {
    const response = await axios.get(API_BASE_URL, { params });
    return response.data;
};

/**
 * Get seat by ID
 * @param {string} id - Seat ID
 * @param {Object} options - Request options
 * @returns {Promise<Object>} - Seat object
 */
export const getSeatById = async (id, options = {}) => {
    const response = await axios.get(`${API_BASE_URL}/${id}`);
    return response.data;
};

/**
 * Create a new seat
 * @param {Object} seatData - Seat data
 * @param {Object} options - Request options
 * @returns {Promise<Object>} - Created seat
 */
export const createSeat = async (seatData, options = {}) => {
    const response = await axios.post(API_BASE_URL, seatData);
    toast.success('Seat created successfully');
    return response.data;
};

/**
 * Update a seat
 * @param {string} id - Seat ID
 * @param {Object} seatData - Updated seat data
 * @param {Object} options - Request options
 * @returns {Promise<Object>} - Updated seat
 */
export const updateSeat = async (id, seatData, options = {}) => {
    const response = await axios.put(`${API_BASE_URL}/${id}`, seatData);
    toast.success('Seat updated successfully');
    return response.data;
};

/**
 * Delete a seat
 * @param {string} id - Seat ID
 * @param {Object} options - Request options
 * @returns {Promise<Object>} - Response data
 */
export const deleteSeat = async (id, options = {}) => {
    const response = await axios.delete(`${API_BASE_URL}/${id}`);
    toast.success('Seat deleted successfully');
    return response.data;
};

/**
 * Get seats by section
 * @param {string} section - Section identifier
 * @param {Object} options - Request options
 * @returns {Promise<Array>} - Array of seats in the section
 */
export const getSeatsBySection = async (section, options = {}) => {
    const response = await axios.get(`${API_BASE_URL}/section/${section}`);
    return response.data;
};

/**
 * Get available seats
 * @param {Object} params - Query parameters (including date, shift, etc.)
 * @param {Object} options - Request options
 * @returns {Promise<Array>} - Array of available seats
 */
export const getAvailableSeats = async (params = {}, options = {}) => {
    const response = await axios.get(`${API_BASE_URL}/available`, { params });
    return response.data;
};

/**
 * Get seat availability for a specific period
 * @param {string} id - Seat ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @param {Object} options - Request options
 * @returns {Promise<Object>} - Availability information
 */
export const getSeatAvailability = async (id, startDate, endDate, options = {}) => {
    const response = await axios.get(`${API_BASE_URL}/${id}/availability`, {
      params: { startDate, endDate }
    });
    return response.data;
};

/**
 * Update seat status
 * @param {string} id - Seat ID
 * @param {string} status - New status
 * @param {Object} options - Request options
 * @returns {Promise<Object>} - Updated seat
 */
export const updateSeatStatus = async (id, status, options = {}) => {
    const response = await axios.put(`${API_BASE_URL}/${id}/status`, { status });
    toast.success(`Seat status updated to ${status}`);
    return response.data;
};

export default {
  getAllSeats,
  getSeatById,
  createSeat,
  updateSeat,
  deleteSeat,
  getSeatsBySection,
  getAvailableSeats,
  getSeatAvailability,
  updateSeatStatus
};