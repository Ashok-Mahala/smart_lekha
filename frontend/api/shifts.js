import axios from './axios';
import { API_CONFIG } from './config';
import { toast } from 'sonner';
import PropTypes from 'prop-types';

const API_BASE_URL = `${API_CONFIG.baseURL}/shifts`;

export const shiftPropTypes = PropTypes.shape({
  _id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  startTime: PropTypes.string.isRequired,
  endTime: PropTypes.string.isRequired,
  fee: PropTypes.number.isRequired,
  property: PropTypes.string.isRequired
});

export const getShifts = async (propertyId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}`, { 
      params: { property: propertyId } 
    });
    return response.data;
  } catch (error) {
    toast.error('Failed to fetch shifts');
    throw error;
  }
};

export const createShift = async (shiftData) => {
  try {
    const response = await axios.post(API_BASE_URL, shiftData);
    toast.success('Shift created successfully');
    return response.data;
  } catch (error) {
    toast.error('Failed to create shift');
    throw error;
  }
};

export const updateShift = async (shiftId, shiftData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/${shiftId}`, shiftData);
    toast.success('Shift updated successfully');
    return response.data;
  } catch (error) {
    toast.error('Failed to update shift');
    throw error;
  }
};

export const deleteShift = async (shiftId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/${shiftId}`);
    toast.success('Shift deleted successfully');
    return response.data;
  } catch (error) {
    toast.error('Failed to delete shift');
    throw error;
  }
};

export default {
  getShifts,
  createShift,
  updateShift,
  deleteShift
};