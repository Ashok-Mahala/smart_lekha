import { ENV } from '../config/env';

/**
 * API Configuration
 * 
 * Centralizes API configuration settings used by axios.
 */
export const API_CONFIG = {
  baseURL: ENV.API_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Feature flag to enable mock API in test environments
export const USE_MOCK_API = ENV.USE_MOCK_API;

// Log the API configuration in development
if (ENV.isDevelopment()) {
  console.log('API Configuration:', {
    baseURL: API_CONFIG.baseURL,
    timeout: API_CONFIG.timeout,
    useMockApi: USE_MOCK_API
  });
}

export default API_CONFIG; 