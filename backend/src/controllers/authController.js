const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { config } = require('../config');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { ApiError } = require('../utils/ApiError');
const { asyncHandler } = require('../utils/asyncHandler');

// Helper function to set refresh token cookie
const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'strict',
    maxAge: 2 * 60 * 1000 // 2 minutes in milliseconds
  });
};

// Helper to create refresh token in database
const createRefreshToken = async (userId, req) => {
  console.log('Starting refresh token creation for user ID:', userId);
  
  const refreshToken = jwt.sign(
    { 
      id: userId,
      type: 'refresh'
    },
    config.jwtSecret,
    { expiresIn: '1d' } // 1 day
  );
  
  console.log('JWT refresh token generated:', refreshToken);
  
  try {
    console.log('Attempting to save refresh token to database...');
    
    const refreshTokenRecord = await RefreshToken.create({
      token: refreshToken,
      userId: userId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day in milliseconds
      deviceInfo: req.headers['user-agent'] || 'Unknown device',
      ipAddress: req.ip || req.connection.remoteAddress
    });
    
    console.log('✅ Refresh token successfully saved to database:', {
      id: refreshTokenRecord.id,
      userId: refreshTokenRecord.userId,
      token: refreshTokenRecord.token.substring(0, 20) + '...', // Show first 20 chars only
      expiresAt: refreshTokenRecord.expiresAt,
      deviceInfo: refreshTokenRecord.deviceInfo,
      ipAddress: refreshTokenRecord.ipAddress
    });
    
    return refreshToken;
  } catch (error) {
    console.error('❌ Error saving refresh token to database:', error);
    throw error; // Re-throw the error to handle it upstream
  }
};

// Register user
const register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, role } = req.body;

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new ApiError(400, 'User already exists');
  }

  // Create user
  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    role: role || 'user'
  });

  // Generate token
  const token = jwt.sign({ id: user._id }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });

  // Generate and store refresh token
  const refreshToken = await createRefreshToken(user._id, req);

  // Set refresh token as HTTP-only cookie
  setRefreshTokenCookie(res, refreshToken);

  res.status(201).json({
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    },
    token,
    expiresIn: config.jwtExpiresIn
  });
});

// Login user
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if user exists
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  // Check password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid credentials');
  }

  // Revoke all existing refresh tokens for this user
  await RefreshToken.updateMany(
    { userId: user._id },
    { isRevoked: true }
  );

  // Generate token
  const token = jwt.sign({ id: user._id }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });

  // Generate and store new refresh token
  const refreshToken = await createRefreshToken(user._id, req);

  // Set refresh token as HTTP-only cookie
  setRefreshTokenCookie(res, refreshToken);

  res.json({
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    },
    token,
    expiresIn: config.jwtExpiresIn
  });
});

// Refresh token endpoint
const refreshToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token required');
  }

  try {
    // Verify the refresh token JWT
    const decoded = jwt.verify(refreshToken, config.jwtSecret);
    
    if (decoded.type !== 'refresh') {
      throw new ApiError(403, 'Invalid token type');
    }

    // Check if token exists and is valid in database
    const storedToken = await RefreshToken.findOne({
      token: refreshToken,
      userId: decoded.id,
      isRevoked: false
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      res.clearCookie('refreshToken');
      throw new ApiError(403, 'Invalid or expired refresh token');
    }

    // Get user data
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Revoke the used refresh token
    await RefreshToken.findByIdAndUpdate(storedToken._id, { isRevoked: true });

    // Generate new access token
    const newAccessToken = jwt.sign(
      { 
        id: user._id,
        email: user.email,
        role: user.role 
      }, 
      config.jwtSecret, 
      { expiresIn: config.jwtExpiresIn }
    );

    // Generate new refresh token
    const newRefreshToken = await createRefreshToken(user._id, req);

    // Set new refresh token cookie
    setRefreshTokenCookie(res, newRefreshToken);

    res.json({
      accessToken: newAccessToken,
      expiresIn: config.jwtExpiresIn
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new ApiError(403, 'Invalid refresh token');
    }
    if (error.name === 'TokenExpiredError') {
      res.clearCookie('refreshToken');
      throw new ApiError(403, 'Refresh token expired');
    }
    throw error;
  }
});

// Logout endpoint
const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  // Revoke the current refresh token
  if (refreshToken) {
    await RefreshToken.findOneAndUpdate(
      { token: refreshToken },
      { isRevoked: true }
    );
  }

  // Clear the refresh token cookie
  res.clearCookie('refreshToken');
  
  res.json({ message: 'Logged out successfully' });
});

// Logout from all devices
const logoutAll = asyncHandler(async (req, res) => {
  // Revoke all refresh tokens for this user
  await RefreshToken.updateMany(
    { userId: req.user._id },
    { isRevoked: true }
  );

  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out from all devices successfully' });
});

// Get current user
const getMe = asyncHandler(async (req, res) => {
  res.json(req.user);
});

// Update profile
const updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, email } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { firstName, lastName, email },
    { new: true, runValidators: true }
  );
  res.json(user);
});

// Change password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);

  // Check current password
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.json({ message: 'Password updated successfully' });
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  getMe,
  updateProfile,
  changePassword
};