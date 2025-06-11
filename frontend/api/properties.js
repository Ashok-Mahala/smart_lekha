import api from './axios';

const PROPERTIES_ENDPOINT = '/properties';

// Get all properties
export const getProperties = async (params = {}) => {
  try {
    const response = await api.get(PROPERTIES_ENDPOINT, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get property by ID
export const getPropertyById = async (id) => {
  try {
    const response = await api.get(`${PROPERTIES_ENDPOINT}/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create new property
export const createProperty = async (propertyData) => {
  try {
    const response = await api.post(PROPERTIES_ENDPOINT, propertyData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update property
export const updateProperty = async (id, propertyData) => {
  try {
    const response = await api.put(`${PROPERTIES_ENDPOINT}/${id}`, propertyData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete property
export const deleteProperty = async (id) => {
  try {
    const response = await api.delete(`${PROPERTIES_ENDPOINT}/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get property zones
export const getPropertyZones = async (propertyId, params = {}) => {
  try {
    const response = await api.get(`${PROPERTIES_ENDPOINT}/${propertyId}/zones`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get property seats
export const getPropertySeats = async (propertyId, params = {}) => {
  try {
    const response = await api.get(`${PROPERTIES_ENDPOINT}/${propertyId}/seats`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get property occupancy
export const getPropertyOccupancy = async (propertyId, params = {}) => {
  try {
    const response = await api.get(`${PROPERTIES_ENDPOINT}/${propertyId}/occupancy`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get property revenue
export const getPropertyRevenue = async (propertyId, params = {}) => {
  try {
    const response = await api.get(`${PROPERTIES_ENDPOINT}/${propertyId}/revenue`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update property settings
export const updatePropertySettings = async (id, settings) => {
  try {
    const response = await api.put(`${PROPERTIES_ENDPOINT}/${id}/settings`, settings);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get property maintenance schedule
export const getPropertyMaintenance = async (propertyId, params = {}) => {
  try {
    const response = await api.get(`${PROPERTIES_ENDPOINT}/${propertyId}/maintenance`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Schedule property maintenance
export const schedulePropertyMaintenance = async (propertyId, maintenanceData) => {
  try {
    const response = await api.post(`${PROPERTIES_ENDPOINT}/${propertyId}/maintenance`, maintenanceData);
    return response.data;
  } catch (error) {
    throw error;
  }
}; 