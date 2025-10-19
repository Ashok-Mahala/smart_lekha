/**
 * Environment Configuration Helper
 * 
 * Centralizes access to environment variables and provides typed access with defaults.
 * This ensures consistent access to environment variables throughout the application.
 */

// Helper function to get environment variables with default values and type conversion
function getEnvVar(key, defaultValue = '', transformer = (v) => v) {
  const value = import.meta.env[key];
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  return transformer(value);
}

// Boolean transformer
const boolTransformer = (value) => {
  return value === 'true' || value === '1' || value === true;
};

// Number transformer
const numberTransformer = (value) => {
  return Number(value);
};

// Environment configuration object
export const ENV = {
  // Current environment
  NODE_ENV: getEnvVar('MODE', 'development'),
  
  // API configuration
  API_URL: getEnvVar('VITE_API_URL', 'http://92.168.1.6:5000/smlekha'),
  WS_URL: getEnvVar('VITE_WS_URL', 'ws://92.168.1.6:5000'),
  
  // Feature flags
  FEATURES: {
    PAYMENTS: getEnvVar('VITE_ENABLE_PAYMENTS', true, boolTransformer),
    NOTIFICATIONS: getEnvVar('VITE_ENABLE_NOTIFICATIONS', true, boolTransformer),
    REPORTS: getEnvVar('VITE_ENABLE_REPORTS', true, boolTransformer),
  },
  
  // Theme configuration
  THEME: {
    DEFAULT: getEnvVar('VITE_DEFAULT_THEME', 'light'),
    CUSTOM_ENABLED: getEnvVar('VITE_CUSTOM_THEME_ENABLED', false, boolTransformer),
  },
  
  // Analytics
  ANALYTICS_ID: getEnvVar('VITE_ANALYTICS_ID', ''),
  
  // Testing
  IS_TEST: getEnvVar('VITE_TEST_MODE', false, boolTransformer),
  USE_MOCK_API: getEnvVar('VITE_MOCK_API', false, boolTransformer),
  
  // Derived properties
  isDevelopment: () => ENV.NODE_ENV === 'development',
  isProduction: () => ENV.NODE_ENV === 'production',
  isTest: () => ENV.NODE_ENV === 'test' || ENV.IS_TEST,
};

// Log the current environment configuration (useful for debugging)
if (ENV.isDevelopment()) {
  console.log('Environment Configuration:', JSON.stringify(ENV, null, 2));
}

export default ENV; 