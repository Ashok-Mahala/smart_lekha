/**
 * API utility functions for handling errors, formatting requests, etc.
 */

import PropTypes from 'prop-types';

export const apiErrorPropTypes = PropTypes.shape({
  message: PropTypes.string.isRequired,
  status: PropTypes.number,
  code: PropTypes.string,
  details: PropTypes.object,
  response: PropTypes.shape({
    data: PropTypes.shape({
      message: PropTypes.string
    })
  })
});

// Format error response
export const formatErrorResponse = (error) => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

// Format date for API requests
export const formatDateForApi = (date) => {
  return date.toISOString().split('T')[0];
};

// Generate a unique reference ID
export const generateReferenceId = (prefix) => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${randomStr}`;
};

// Create query string from parameters
export const createQueryString = (params) => {
  return Object.keys(params)
    .filter(key => params[key] !== undefined && params[key] !== null)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(String(params[key]))}`)
    .join('&');
};

// Parse API response
export const parseApiResponse = (response) => {
  if (!response || typeof response !== 'object') {
    throw new Error('Invalid API response format');
  }
  
  return response;
};

// Simulate API delay (for development only)
export const simulateApiDelay = async (minMs = 200, maxMs = 800) => {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise(resolve => setTimeout(resolve, delay));
};

export const handleApiError = (error) => {
  const apiError = error;
  // ... existing code ...
};

export const handleApiResponse = async (response) => {
  // ... existing code ...
  return response;
};
