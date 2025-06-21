const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  startTime: {
    type: String,  // Store as string (e.g., "08:00")
    required: true
  },
  endTime: {
    type: String,  // Store as string (e.g., "17:00")
    required: true
  },
  fee: {
    type: Number,  // Store as Number (e.g., 1700)
    required: true
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
shiftSchema.index({ property: 1});

const Shift = mongoose.model('Shift', shiftSchema);

module.exports = Shift; 