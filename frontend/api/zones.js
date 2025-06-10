import api from './axios';

const ZONES_ENDPOINT = '/smlekha/zones';

// Get all zones
export const getZones = async (params = {}) => {
  try {
    const response = await api.get(ZONES_ENDPOINT, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get zone by ID
export const getZoneById = async (id) => {
  try {
    const response = await api.get(`${ZONES_ENDPOINT}/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create new zone
export const createZone = async (zoneData) => {
  try {
    const response = await api.post(ZONES_ENDPOINT, zoneData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update zone
export const updateZone = async (id, zoneData) => {
  try {
    const response = await api.put(`${ZONES_ENDPOINT}/${id}`, zoneData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete zone
export const deleteZone = async (id) => {
  try {
    const response = await api.delete(`${ZONES_ENDPOINT}/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get zone seats
export const getZoneSeats = async (zoneId, params = {}) => {
  try {
    const response = await api.get(`${ZONES_ENDPOINT}/${zoneId}/seats`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get zone occupancy
export const getZoneOccupancy = async (zoneId, params = {}) => {
  try {
    const response = await api.get(`${ZONES_ENDPOINT}/${zoneId}/occupancy`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get zone bookings
export const getZoneBookings = async (zoneId, params = {}) => {
  try {
    const response = await api.get(`${ZONES_ENDPOINT}/${zoneId}/bookings`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update zone settings
export const updateZoneSettings = async (id, settings) => {
  try {
    const response = await api.put(`${ZONES_ENDPOINT}/${id}/settings`, settings);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get zone maintenance schedule
export const getZoneMaintenance = async (zoneId, params = {}) => {
  try {
    const response = await api.get(`${ZONES_ENDPOINT}/${zoneId}/maintenance`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Schedule zone maintenance
export const scheduleZoneMaintenance = async (zoneId, maintenanceData) => {
  try {
    const response = await api.post(`${ZONES_ENDPOINT}/${zoneId}/maintenance`, maintenanceData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchZoneStats = async () => {
  try {
    const response = await fetch('/smlekha/zones/stats');
    
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('API endpoint not available');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching zone stats:', error);
    return {
      total: 0,
      active: 0,
      inactive: 0,
      totalSeats: 0,
      availableSeats: 0,
      occupiedSeats: 0,
    };
  }
}; 