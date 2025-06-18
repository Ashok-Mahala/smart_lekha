const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved', 'maintenance', 'deleted'],
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
  notes: String,
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
seatSchema.index({ propertyId: 1 });
seatSchema.index({ seatNumber: 1 });
seatSchema.index({ status: 1 });
seatSchema.index({ type: 1 });
seatSchema.index({ currentStudent: 1 });
seatSchema.index({ deletedAt: 1 });

// Query helper to exclude deleted seats by default
seatSchema.pre(/^find/, function(next) {
  // Only apply to queries that don't explicitly want deleted seats
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }
  next();
});

// Method to check if seat is available
seatSchema.methods.isAvailable = function() {
  return this.status === 'available' && !this.deletedAt;
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

// Method to soft delete seat
seatSchema.methods.softDelete = function() {
  this.status = 'deleted';
  this.deletedAt = new Date();
  return this.save();
};

// Method to reactivate seat
seatSchema.methods.reactivate = function() {
  this.status = 'available';
  this.deletedAt = null;
  return this.save();
};

// Static method for bulk reactivation
seatSchema.statics.bulkReactivate = async function(seatIds) {
  return this.updateMany(
    { _id: { $in: seatIds } },
    { $set: { status: 'available' }, $unset: { deletedAt: 1 } }
  );
};

// Static method for bulk soft deletion
seatSchema.statics.bulkSoftDelete = async function(seatIds) {
  return this.updateMany(
    { _id: { $in: seatIds } },
    { $set: { status: 'deleted', deletedAt: new Date() } }
  );
};

const Seat = mongoose.model('Seat', seatSchema);

module.exports = Seat;