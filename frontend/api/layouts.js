// api/layouts.js
import api from './axios';

const LAYOUTS_ENDPOINT = '/layouts';

// Get layout configuration
export const getLayout = async (propertyId) => {
  try {
    const response = await api.get(`${LAYOUTS_ENDPOINT}/${propertyId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching layout:', error);
    throw error;
  }
};

// Save layout configuration
export const saveLayout = async (propertyId, layoutData) => {
  try {
    const response = await api.post(`${LAYOUTS_ENDPOINT}/${propertyId}`, layoutData);
    return response.data;
  } catch (error) {
    console.error('Error saving layout:', error);
    throw error;
  }
};