const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  zone: {
    type: String,
    enum: ['full-day', 'half-day', 'reading-area', 'computer-zone', 'quiet-study', 'group-study'],
    required: true
  },
  currentOccupancy: {
    type: Number,
    default: 0,
    min: 0
  },
  staffAssigned: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
shiftSchema.index({ date: 1, zone: 1 });
shiftSchema.index({ isActive: 1 });

// Method to check if shift is available
shiftSchema.methods.isAvailable = function() {
  return this.currentOccupancy < this.capacity;
};

// Method to increment occupancy
shiftSchema.methods.incrementOccupancy = async function() {
  if (!this.isAvailable()) {
    throw new Error('Shift is at full capacity');
  }
  this.currentOccupancy += 1;
  return this.save();
};

// Method to decrement occupancy
shiftSchema.methods.decrementOccupancy = async function() {
  if (this.currentOccupancy <= 0) {
    throw new Error('Shift occupancy cannot be negative');
  }
  this.currentOccupancy -= 1;
  return this.save();
};

const Shift = mongoose.model('Shift', shiftSchema);

module.exports = Shift; 