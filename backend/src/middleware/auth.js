const jwt = require('jsonwebtoken');
const { config } = require('../config');
const { ApiError } = require('../utils/ApiError');
const User = require('../models/User');

// Protect routes
const protect = async (req, res, next) => {
  try {
    //console.log('Headers:', req.headers); // Debug: Log all headers
    //console.log('Auth Header:', req.headers.authorization); // Debug: Specific auth header
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new ApiError(401, 'Not authorized to access this route');
    }

    try {
    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);

    // Get user from token
      req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch (err) {
      throw new ApiError(401, 'Not authorized to access this route');
    }
  } catch (error) {
    next(error);
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Not authorized to access this route'));
    }
    next();
  };
};

module.exports = { protect, authorize }; 