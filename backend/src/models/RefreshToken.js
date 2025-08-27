// models/RefreshToken.js
const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  deviceInfo: {
    type: String,
    default: 'Unknown device'
  },
  ipAddress: {
    type: String
  },
  isRevoked: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 0 // Manual expiration handling
  }
});

// Index for automatic cleanup of expired tokens
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for user-based queries
refreshTokenSchema.index({ userId: 1 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);