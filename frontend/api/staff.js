import api from './axios';

const STAFF_ENDPOINT = '/api/staff';

// Get all staff members
export const getStaff = async (params = {}) => {
  try {
    const response = await api.get(STAFF_ENDPOINT, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get staff member by ID
export const getStaffById = async (id) => {
  try {
    const response = await api.get(`${STAFF_ENDPOINT}/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create new staff member
export const createStaff = async (staffData) => {
  try {
    const response = await api.post(STAFF_ENDPOINT, staffData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update staff member
export const updateStaff = async (id, staffData) => {
  try {
    const response = await api.put(`${STAFF_ENDPOINT}/${id}`, staffData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete staff member
export const deleteStaff = async (id) => {
  try {
    const response = await api.delete(`${STAFF_ENDPOINT}/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get staff attendance
export const getStaffAttendance = async (id, params = {}) => {
  try {
    const response = await api.get(`${STAFF_ENDPOINT}/${id}/attendance`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get staff performance metrics
export const getStaffPerformance = async (id, params = {}) => {
  try {
    const response = await api.get(`${STAFF_ENDPOINT}/${id}/performance`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update staff role
export const updateStaffRole = async (id, role) => {
  try {
    const response = await api.put(`${STAFF_ENDPOINT}/${id}/role`, { role });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get staff schedule
export const getStaffSchedule = async (id, params = {}) => {
  try {
    const response = await api.get(`${STAFF_ENDPOINT}/${id}/schedule`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update staff schedule
export const updateStaffSchedule = async (id, scheduleData) => {
  try {
    const response = await api.put(`${STAFF_ENDPOINT}/${id}/schedule`, scheduleData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchStaffStats = async () => {
  try {
    const response = await fetch('/api/staff/stats');
    
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('API endpoint not available');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching staff stats:', error);
    return {
      total: 0,
      active: 0,
      inactive: 0,
      admin: 0,
      manager: 0,
      staff: 0,
    };
  }
}; 