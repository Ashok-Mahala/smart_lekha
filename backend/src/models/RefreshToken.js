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
    // NO TTL index here - we'll handle expiration manually
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
    // NO TTL index here either
  }
});

// Only these indexes - NO TTL indexes
refreshTokenSchema.index({ userId: 1 });
// token_1 index is automatically created by the unique constraint

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);