import api from './axios';

const BOOKINGS_ENDPOINT = '/smlekha/bookings';

// Get all bookings
export const getBookings = async (params = {}) => {
  try {
    const response = await api.get(BOOKINGS_ENDPOINT, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get booking by ID
export const getBookingById = async (id) => {
  try {
    const response = await api.get(`${BOOKINGS_ENDPOINT}/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create new booking
export const createBooking = async (bookingData) => {
  try {
    const response = await api.post(BOOKINGS_ENDPOINT, bookingData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update booking
export const updateBooking = async (id, bookingData) => {
  try {
    const response = await api.put(`${BOOKINGS_ENDPOINT}/${id}`, bookingData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete booking
export const deleteBooking = async (id) => {
  try {
    const response = await api.delete(`${BOOKINGS_ENDPOINT}/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get user bookings
export const getUserBookings = async (userId, params = {}) => {
  try {
    const response = await api.get(`${BOOKINGS_ENDPOINT}/user/${userId}`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get zone bookings
export const getZoneBookings = async (zoneId, params = {}) => {
  try {
    const response = await api.get(`${BOOKINGS_ENDPOINT}/zone/${zoneId}`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get property bookings
export const getPropertyBookings = async (propertyId, params = {}) => {
  try {
    const response = await api.get(`${BOOKINGS_ENDPOINT}/property/${propertyId}`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update booking status
export const updateBookingStatus = async (id, status) => {
  try {
    const response = await api.put(`${BOOKINGS_ENDPOINT}/${id}/status`, { status });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get booking statistics
export const getBookingStats = async (params = {}) => {
  try {
    const response = await api.get(`${BOOKINGS_ENDPOINT}/stats`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Check seat availability
export const checkSeatAvailability = async (params = {}) => {
  try {
    const response = await api.get(`${BOOKINGS_ENDPOINT}/availability`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get booking schedule
export const getBookingSchedule = async (params = {}) => {
  try {
    const response = await api.get(`${BOOKINGS_ENDPOINT}/schedule`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
}; 