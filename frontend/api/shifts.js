import axios from './axios';
import { toast } from 'sonner';
import PropTypes from 'prop-types';

const API_BASE_URL = '/shifts';

// PropTypes
export const shiftPropTypes = PropTypes.shape({
  _id: PropTypes.string,
  name: PropTypes.string.isRequired,
  startTime: PropTypes.string.isRequired,
  endTime: PropTypes.string.isRequired
});

// Create new shift
export const createShift = async (shiftData) => {
  try {
    const response = await axios.post(API_BASE_URL, shiftData);
    toast.success('Shift created successfully');
    return response.data;
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to create shift');
    throw error;
  }
};

// Get all shifts
export const getShifts = async () => {
  try {
    const response = await axios.get(API_BASE_URL);
    return response.data;
  } catch (error) {
    toast.error('Failed to fetch shifts');
    throw error;
  }
};

// Update shift
export const updateShift = async (id, shiftData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/${id}`, shiftData);
    toast.success('Shift updated successfully');
    return response.data;
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to update shift');
    throw error;
  }
};

// Delete shift
export const deleteShift = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/${id}`);
    toast.success('Shift deleted successfully');
    return response.data;
  } catch (error) {
    toast.error('Failed to delete shift');
    throw error;
  }
};