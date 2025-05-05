/**
 * Error handler middleware for consistent API error responses
 */

// Define error types & codes
const ERROR_TYPES = {
  VALIDATION: 'ValidationError',
  NOT_FOUND: 'NotFoundError',
  UNAUTHORIZED: 'UnauthorizedError',
  FORBIDDEN: 'ForbiddenError',
  CONFLICT: 'ConflictError',
  BAD_REQUEST: 'BadRequestError',
  INTERNAL: 'InternalServerError',
  DATABASE: 'DatabaseError',
};

// Error codes that match the frontend codes
const ERROR_CODES = {
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
};

// HTTP Status by error type mapping
const ERROR_STATUS = {
  [ERROR_TYPES.VALIDATION]: 422,
  [ERROR_TYPES.NOT_FOUND]: 404,
  [ERROR_TYPES.UNAUTHORIZED]: 401,
  [ERROR_TYPES.FORBIDDEN]: 403,
  [ERROR_TYPES.CONFLICT]: 409,
  [ERROR_TYPES.BAD_REQUEST]: 400,
  [ERROR_TYPES.INTERNAL]: 500,
  [ERROR_TYPES.DATABASE]: 500,
};

/**
 * Custom API Error class for consistent error handling
 */
class ApiError extends Error {
  constructor(type, message, details = null, code = null) {
    super(message);
    this.name = type;
    this.code = code || mapTypeToCode(type);
    this.details = details;
    this.status = ERROR_STATUS[type] || 500;
  }
}

/**
 * Map error type to an error code
 */
function mapTypeToCode(type) {
  switch (type) {
    case ERROR_TYPES.VALIDATION:
      return ERROR_CODES.VALIDATION_ERROR;
    case ERROR_TYPES.NOT_FOUND:
      return ERROR_CODES.NOT_FOUND;
    case ERROR_TYPES.UNAUTHORIZED:
      return ERROR_CODES.UNAUTHORIZED;
    case ERROR_TYPES.FORBIDDEN:
      return ERROR_CODES.FORBIDDEN;
    case ERROR_TYPES.CONFLICT:
      return ERROR_CODES.ALREADY_EXISTS;
    case ERROR_TYPES.BAD_REQUEST:
      return ERROR_CODES.BAD_REQUEST;
    case ERROR_TYPES.INTERNAL:
      return ERROR_CODES.SERVER_ERROR;
    case ERROR_TYPES.DATABASE:
      return ERROR_CODES.DATABASE_ERROR;
    default:
      return ERROR_CODES.SERVER_ERROR;
  }
}

/**
 * Handle MongoDB validation errors
 */
function handleMongooseError(err) {
  if (err.name === 'ValidationError') {
    const errors = {};
    
    // Format mongoose validation errors
    Object.keys(err.errors).forEach((key) => {
      errors[key] = err.errors[key].message;
    });
    
    return new ApiError(
      ERROR_TYPES.VALIDATION,
      'Validation failed',
      { errors }
    );
  }
  
  // Handle duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    
    return new ApiError(
      ERROR_TYPES.CONFLICT,
      `${field} already exists with value: ${value}`,
      { field, value }
    );
  }
  
  return new ApiError(
    ERROR_TYPES.DATABASE,
    'Database error',
    { message: err.message }
  );
}

/**
 * Error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  let error = err;
  
  // Convert mongoose errors to ApiError
  if (err.name === 'ValidationError' || err.name === 'MongoError' || err.code === 11000) {
    error = handleMongooseError(err);
  }
  
  // If not an ApiError, convert to one
  if (!(error instanceof ApiError)) {
    error = new ApiError(
      ERROR_TYPES.INTERNAL,
      error.message || 'Internal server error'
    );
  }
  
  // Log the error
  console.error(`${error.name}: ${error.message}`);
  
  // Send the error response
  res.status(error.status).json({
    code: error.code,
    message: error.message,
    details: error.details,
    status: error.status,
  });
};

// Export error handling utilities
module.exports = {
  errorHandler,
  ApiError,
  ERROR_TYPES,
  ERROR_CODES
}; 