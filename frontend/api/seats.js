import axios from './axios';
import { API_CONFIG } from './config';
import { toast } from 'sonner';
import PropTypes from 'prop-types';

const API_BASE_URL = `${API_CONFIG.baseURL}/seats`;

// Updated PropTypes matching new Seat model
export const seatPropTypes = PropTypes.shape({
  _id: PropTypes.string.isRequired,
  propertyId: PropTypes.string.isRequired,
  status: PropTypes.oneOf(['available', 'occupied', 'reserved', 'maintenance', 'deleted']).isRequired,
  seatNumber: PropTypes.string.isRequired,
  row: PropTypes.number.isRequired, // Changed from string to number
  column: PropTypes.number.isRequired,
  type: PropTypes.oneOf(['standard', 'premium', 'handicap', 'other']),
  features: PropTypes.arrayOf(
    PropTypes.oneOf(['power_outlet', 'table', 'extra_space', 'window', 'aisle'])
  ),
  currentAssignments: PropTypes.array, // Added for new structure
  assignmentHistory: PropTypes.array, // Added for new structure
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
  notes: PropTypes.string,
  deletedAt: PropTypes.string
});

// API functions matching your new controller
export const getSeatsByProperty = async (propertyId) => {
  try {
    const response = await axios.get(`/seats/property/${propertyId}`);
    // Return the data array from the response
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching seats:', error);
    throw error;
  }
};

// New function for assigning student to seat
export const assignStudentToSeat = async (seatId, assignmentData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/${seatId}/assign`, assignmentData);
    toast.success('Student assigned to seat successfully');
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to assign student to seat';
    toast.error(errorMessage);
    throw error;
  }
};

// New function for releasing student from seat
export const releaseStudentFromSeat = async (seatId, releaseData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/${seatId}/release`, releaseData);
    toast.success('Student released from seat successfully');
    return response.data;
  } catch (error) {
    toast.error('Failed to release student from seat');
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

export const bulkUpdateSeats = async (updates) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/bulk-update`, updates, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (updates.length > 0) {
      toast.success(`Updated ${updates.length} seats`);
    }
    return response.data;
  } catch (error) {
    console.error('Bulk update failed:', error);
    toast.error('Failed to update seats');
    throw error;
  }
};

// Remove old bookSeat function since we're using assignStudentToSeat now
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

// Remove getShifts function as it should be in shifts API
export const updateSeatStatus = async (seatId, status) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/${seatId}/status`, { status });
    toast.success(`Seat status updated to ${status}`);
    return response.data;
  } catch (error) {
    toast.error('Failed to update seat status');
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

// New function for getting seat assignment history
export const getSeatAssignmentHistory = async (seatId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${seatId}/history`);
    return response.data;
  } catch (error) {
    toast.error('Failed to fetch seat assignment history');
    throw error;
  }
};

export const deassignStudent = async (seatId, deassignData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/${seatId}/deassign`, deassignData);
    toast.success('Student deassigned successfully');
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to deassign student';
    toast.error(errorMessage);
    throw error;
  }
};

// Change student seat
export const changeStudentSeat = async (changeSeatData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/change-seat`, changeSeatData);
    toast.success('Seat changed successfully');
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to change seat';
    toast.error(errorMessage);
    throw error;
  }
};


export default {
  getSeatsByProperty,
  assignStudentToSeat,
  releaseStudentFromSeat,
  bulkCreateSeats,
  bulkUpdateSeats,
  reserveSeat,
  updateSeatStatus,
  deleteSeat,
  getSeatAssignmentHistory,
  deassignStudent,
  changeStudentSeat
};