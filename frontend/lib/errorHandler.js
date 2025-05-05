import { toast } from 'sonner';

/**
 * Error codes and their corresponding messages
 */
export const ERROR_CODES = {
  // Authentication errors
  UNAUTHORIZED: 'unauthorized',
  INVALID_CREDENTIALS: 'invalid_credentials',
  SESSION_EXPIRED: 'session_expired',
  TOKEN_EXPIRED: 'token_expired',
  
  // Resource errors
  NOT_FOUND: 'not_found',
  ALREADY_EXISTS: 'already_exists',
  VALIDATION_ERROR: 'validation_error',
  
  // Server errors
  SERVER_ERROR: 'server_error',
  SERVICE_UNAVAILABLE: 'service_unavailable',
  DATABASE_ERROR: 'database_error',
  
  // Request errors
  BAD_REQUEST: 'bad_request',
  FORBIDDEN: 'forbidden',
  TOO_MANY_REQUESTS: 'too_many_requests',
  
  // Network errors
  NETWORK_ERROR: 'network_error',
  TIMEOUT: 'timeout',
};

/**
 * User-friendly error messages
 */
export const ERROR_MESSAGES = {
  // Authentication errors
  [ERROR_CODES.UNAUTHORIZED]: 'You are not authorized to perform this action',
  [ERROR_CODES.INVALID_CREDENTIALS]: 'Invalid email or password',
  [ERROR_CODES.SESSION_EXPIRED]: 'Your session has expired, please login again',
  [ERROR_CODES.TOKEN_EXPIRED]: 'Your session has expired, please login again',
  
  // Resource errors
  [ERROR_CODES.NOT_FOUND]: 'The requested resource was not found',
  [ERROR_CODES.ALREADY_EXISTS]: 'This resource already exists',
  [ERROR_CODES.VALIDATION_ERROR]: 'Please check the form for errors',
  
  // Server errors
  [ERROR_CODES.SERVER_ERROR]: 'An unexpected error occurred on the server',
  [ERROR_CODES.SERVICE_UNAVAILABLE]: 'This service is temporarily unavailable',
  [ERROR_CODES.DATABASE_ERROR]: 'A database error occurred',
  
  // Request errors
  [ERROR_CODES.BAD_REQUEST]: 'Invalid request, please check your input',
  [ERROR_CODES.FORBIDDEN]: 'You do not have permission to access this resource',
  [ERROR_CODES.TOO_MANY_REQUESTS]: 'Too many requests, please try again later',
  
  // Network errors
  [ERROR_CODES.NETWORK_ERROR]: 'Network error, please check your connection',
  [ERROR_CODES.TIMEOUT]: 'Request timed out, please try again',
};

/**
 * Map HTTP status codes to error codes
 */
export const HTTP_STATUS_TO_ERROR_CODE = {
  400: ERROR_CODES.BAD_REQUEST,
  401: ERROR_CODES.UNAUTHORIZED,
  403: ERROR_CODES.FORBIDDEN,
  404: ERROR_CODES.NOT_FOUND,
  409: ERROR_CODES.ALREADY_EXISTS,
  422: ERROR_CODES.VALIDATION_ERROR,
  429: ERROR_CODES.TOO_MANY_REQUESTS,
  500: ERROR_CODES.SERVER_ERROR,
  503: ERROR_CODES.SERVICE_UNAVAILABLE,
};

/**
 * Standardized API error structure
 */
export class ApiError extends Error {
  constructor(code, message, details = null, status = null) {
    super(message || ERROR_MESSAGES[code] || 'An unknown error occurred');
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

/**
 * Convert any error to an ApiError with standardized format
 * @param {Error} error - The error to handle
 * @returns {ApiError} - Standardized ApiError
 */
export const handleApiError = (error) => {
  // If it's already an ApiError, return it
  if (error instanceof ApiError) {
    return error;
  }

  // Handle axios error response
  if (error.response) {
    const { status, data } = error.response;
    const errorCode = data.code || HTTP_STATUS_TO_ERROR_CODE[status] || ERROR_CODES.SERVER_ERROR;
    const errorMessage = data.message || ERROR_MESSAGES[errorCode];
    return new ApiError(errorCode, errorMessage, data.details, status);
  }

  // Handle network errors (no response)
  if (error.request) {
    // Request was made but no response was received
    if (error.code === 'ECONNABORTED') {
      return new ApiError(ERROR_CODES.TIMEOUT, ERROR_MESSAGES[ERROR_CODES.TIMEOUT]);
    }
    return new ApiError(ERROR_CODES.NETWORK_ERROR, ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR]);
  }

  // Unknown errors
  return new ApiError(ERROR_CODES.SERVER_ERROR, error.message || ERROR_MESSAGES[ERROR_CODES.SERVER_ERROR]);
};

/**
 * Display appropriate error toast based on the error
 * @param {Error} error - The error to display
 * @param {Object} options - Toast options
 */
export const showErrorToast = (error, options = {}) => {
  const apiError = handleApiError(error);
  toast.error(apiError.message, {
    description: apiError.details?.message,
    ...options
  });
};

/**
 * Helper function to handle form errors from API validation errors
 * @param {Error} error - The API error
 * @param {Object} form - The form object from react-hook-form
 * @returns {boolean} - True if the error was handled as form errors
 */
export const handleFormErrors = (error, form) => {
  const apiError = handleApiError(error);
  
  // Handle validation errors
  if (apiError.code === ERROR_CODES.VALIDATION_ERROR && apiError.details?.errors) {
    const fieldErrors = apiError.details.errors;
    
    // Set errors on form fields
    Object.keys(fieldErrors).forEach(field => {
      form.setError(field, {
        type: 'server',
        message: fieldErrors[field]
      });
    });
    
    // Show a general validation error toast
    toast.error(apiError.message);
    return true;
  }
  
  // If it's not a validation error, just show the error toast
  showErrorToast(apiError);
  return false;
};

/**
 * Main error handler function for async operations
 * @param {Promise} promise - The promise to handle
 * @param {Object} options - Options for error handling
 * @returns {Promise} - The handled promise
 */
export const withErrorHandling = async (promise, options = {}) => {
  const { form, showToast = true, rethrow = false } = options;
  
  try {
    return await promise;
  } catch (error) {
    const apiError = handleApiError(error);
    
    // Handle form errors if form is provided
    if (form && handleFormErrors(apiError, form)) {
      // Form errors have been handled
    } else if (showToast) {
      // Show general error toast
      showErrorToast(apiError);
    }
    
    // Rethrow if needed
    if (rethrow) {
      throw apiError;
    }
    
    return null;
  }
};

export default {
  ApiError,
  ERROR_CODES,
  ERROR_MESSAGES,
  handleApiError,
  showErrorToast,
  handleFormErrors,
  withErrorHandling
}; 