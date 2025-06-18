const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved', 'maintenance'],
    default: 'available'
  },
  reservedUntil: Date,
  seatNumber: {
    type: String,
    required: true,
    trim: true
  },
  row: {
    type: Number,
    required: true,
  },
  column: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved', 'maintenance'],
    default: 'available'
  },
  type: {
    type: String,
    enum: ['standard', 'premium', 'handicap', 'other'],
    default: 'standard'
  },
  features: [{
    type: String,
    enum: ['power_outlet', 'table', 'extra_space', 'window', 'aisle']
  }],
  currentStudent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  },
  lastAssigned: {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    date: Date
  },
  maintenanceHistory: [{
    date: Date,
    description: String,
    performedBy: String
  }],
  notes: String
}, {
  timestamps: true
});

// Indexes
seatSchema.index({ propertyId: 1 });
seatSchema.index({ seatNumber: 1 });
seatSchema.index({ status: 1 });
seatSchema.index({ type: 1 });
seatSchema.index({ currentStudent: 1 });

// Method to check if seat is available
seatSchema.methods.isAvailable = function() {
  return this.status === 'available';
};

// Method to assign student to seat
seatSchema.methods.assignStudent = async function(studentId) {
  if (!this.isAvailable()) {
    throw new Error('Seat is not available');
  }
  
  this.currentStudent = studentId;
  this.status = 'occupied';
  this.lastAssigned = {
    student: studentId,
    date: new Date()
  };
  
  return this.save();
};

// Method to release seat
seatSchema.methods.release = function() {
  this.currentStudent = null;
  this.status = 'available';
  return this.save();
};

const Seat = mongoose.model('Seat', seatSchema);

module.exports = Seat; 