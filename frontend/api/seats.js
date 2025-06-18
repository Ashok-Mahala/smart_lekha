// @/api/seats.js
import axios from './axios';
import { API_CONFIG } from './config';
import { toast } from 'sonner';
import PropTypes from 'prop-types';

const API_BASE_URL = `${API_CONFIG.baseURL}/seats`;

// PropTypes matching your Seat model
export const seatPropTypes = PropTypes.shape({
  _id: PropTypes.string.isRequired,
  propertyId: PropTypes.string.isRequired,
  status: PropTypes.oneOf(['available', 'occupied', 'reserved', 'maintenance']).isRequired,
  seatNumber: PropTypes.string.isRequired,
  row: PropTypes.string.isRequired,
  column: PropTypes.number.isRequired,
  type: PropTypes.oneOf(['standard', 'premium', 'handicap', 'other']),
  features: PropTypes.arrayOf(
    PropTypes.oneOf(['power_outlet', 'table', 'extra_space', 'window', 'aisle'])
  ),
  currentStudent: PropTypes.string,
  reservedUntil: PropTypes.string,
  lastAssigned: PropTypes.shape({
    student: PropTypes.string,
    date: PropTypes.string
  }),
  maintenanceHistory: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string,
      description: PropTypes.string,
      performedBy: PropTypes.string
    })
  ),
  notes: PropTypes.string
});

// API functions matching your controller exactly
export const getSeatsByProperty = async (propertyId, params = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/property/${propertyId}`, { params });
    return response.data;
  } catch (error) {
    toast.error('Failed to fetch seats');
    throw error;
  }
};

export const bulkCreateSeats = async (seatsData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/bulk`, { seats: seatsData });
    toast.success(`Created ${seatsData.length} seats`);
    return response.data;
  } catch (error) {
    toast.error('Failed to create seats');
    throw error;
  }
};

// New function for bulk updating seats
export const bulkUpdateSeats = async (updates) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/bulk-update`, { updates });
    
    // Enhanced success message based on operation types
    const reactivatedCount = updates.filter(u => 
      u.updates.status === 'available' && u.updates.deletedAt === undefined
    ).length;
    
    const deletedCount = updates.filter(u => 
      u.updates.status === 'deleted'
    ).length;
    
    const updatedCount = updates.length - reactivatedCount - deletedCount;

    let message = '';
    if (reactivatedCount > 0) message += `Reactivated ${reactivatedCount} seats. `;
    if (deletedCount > 0) message += `Deleted ${deletedCount} seats. `;
    if (updatedCount > 0) message += `Updated ${updatedCount} seats.`;
    
    toast.success(message.trim() || 'No changes were needed');
    return response.data;
  } catch (error) {
    // More specific error message based on response
    const errorMessage = error.response?.data?.error || 'Failed to update seats';
    toast.error(errorMessage);
    throw error;
  }
};

// New function for bulk deleting seats
export const bulkDeleteSeats = async (seatIds) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/bulk-delete`, { seatIds });
    toast.success(`Deleted ${seatIds.length} seats`);
    return response.data;
  } catch (error) {
    toast.error('Failed to delete seats');
    throw error;
  }
};

export const bookSeat = async (seatId, bookingData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/${seatId}/book`, bookingData);
    toast.success('Seat booked successfully');
    return response.data;
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to book seat');
    throw error;
  }
};

export const reserveSeat = async (seatId, reservationData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/${seatId}/reserve`, reservationData);
    toast.success('Seat reserved successfully');
    return response.data;
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to reserve seat');
    throw error;
  }
};

export const releaseSeat = async (seatId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/${seatId}/release`);
    toast.success('Seat released successfully');
    return response.data;
  } catch (error) {
    toast.error('Failed to release seat');
    throw error;
  }
};

export const getSeatStats = async (propertyId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/stats`, { params: { propertyId } });
    return response.data;
  } catch (error) {
    toast.error('Failed to get statistics');
    throw error;
  }
};

export const getShifts = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/shifts`);
    return response.data;
  } catch (error) {
    toast.error('Failed to fetch shifts');
    throw error;
  }
};

export const updateSeatStatus = async (seatId, status) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/${seatId}/status`, { status });
    toast.success(`Status updated to ${status}`);
    return response.data;
  } catch (error) {
    toast.error('Failed to update status');
    throw error;
  }
};

export const deleteSeat = async (seatId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/${seatId}`);
    toast.success('Seat deleted successfully');
    return response.data;
  } catch (error) {
    toast.error('Failed to delete seat');
    throw error;
  }
};

export default {
  getSeatsByProperty,
  bulkCreateSeats,
  bulkUpdateSeats,  // Added
  bulkDeleteSeats,  // Added
  bookSeat,
  reserveSeat,
  releaseSeat,
  getSeatStats,
  getShifts,
  updateSeatStatus,
  deleteSeat
};