const jwt = require('jsonwebtoken');
const { config } = require('../config');
const { ApiError } = require('../utils/ApiError');
const User = require('../models/User');

// Protect routes
const protect = async (req, res, next) => {
    try {
      // console.log('🔐 [AUTH] Starting authentication check for:', req.method, req.originalUrl);
      // console.log('🔐 [AUTH] Headers received:', {
      //   authorization: req.headers.authorization ? 'Present' : 'Missing',
      //   'content-type': req.headers['content-type'],
      //   'user-agent': req.headers['user-agent']?.substring(0, 50) + '...'
      // });
      
      let token;

      if (req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
        // console.log('✅ [AUTH] Token extracted from header. Length:', token?.length);
        // console.log('✅ [AUTH] Token prefix:', token?.substring(0, 20) + '...');
      } else {
        // console.log('❌ [AUTH] No Bearer token found in authorization header');
        // console.log('❌ [AUTH] Authorization header value:', req.headers.authorization);
        // console.log("chirangee path 1");
        // RETURN 401 instead of throwing
        return res.status(401).json({
          success: false,
          message: 'Not authorized to access this route'
        });
      }

      if (!token) {
        // console.log('❌ [AUTH] Token is empty or undefined after extraction');
        // console.log("chirangee path 1");
        // RETURN 401 instead of throwing
        return res.status(401).json({
          success: false,
          message: 'Not authorized to access this route'
        });
      }

      try {
        // console.log('🔐 [AUTH] Verifying JWT token...');
        // Verify token
        const decoded = jwt.verify(token, config.jwtSecret);
        // console.log('✅ [AUTH] JWT verified successfully. Decoded payload:', {
        //   id: decoded.id,
        //   type: decoded.type,
        //   iat: decoded.iat,
        //   exp: decoded.exp
        // });

        // console.log('🔐 [AUTH] Fetching user from database with ID:', decoded.id);
        // Get user from token
        req.user = await User.findById(decoded.id).select('-password');
        
        if (!req.user) {
          // console.log('❌ [AUTH] User not found in database for ID:', decoded.id);
          // RETURN 401 instead of throwing
          return res.status(401).json({
            success: false,
            message: 'User not found'
          });
        }

        // console.log('✅ [AUTH] User authenticated successfully:', {
        //   userId: req.user._id,
        //   email: req.user.email,
        //   role: req.user.role
        // });
        
        next();
      } catch (jwtError) {
        // console.log('❌ [AUTH] JWT verification failed:', {
        //   error: jwtError.name,
        //   message: jwtError.message,
        //   expiredAt: jwtError.expiredAt
        // });
        
        if (jwtError.name === 'TokenExpiredError') {
          // console.log('❌ [AUTH] Token expired at:', jwtError.expiredAt);
          // console.log('❌ [AUTH] Current time:', new Date());
        } else if (jwtError.name === 'JsonWebTokenError') {
          // console.log('❌ [AUTH] JWT error - possibly invalid signature or malformed token');
        }
        
        // RETURN 401 instead of throwing
        return res.status(401).json({
          success: false,
          message: 'Token expired or invalid',
          error: jwtError.name
        });
      }
    } catch (error) {
      // console.log('🔐 [AUTH] Final catch block - Error type:', error.constructor.name);
      // console.log('🔐 [AUTH] Error message:', error.message);
      // console.log('🔐 [AUTH] Error statusCode:', error.statusCode);
      
      // If it's an ApiError with 401 status, return it properly
      if (error.statusCode === 401) {
        return res.status(401).json({
          success: false,
          message: error.message
        });
      }
      
      // For other unexpected errors, return 500
      // console.error('🔐 [AUTH] Unexpected error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
    next();
  };
};

module.exports = { protect, authorize };