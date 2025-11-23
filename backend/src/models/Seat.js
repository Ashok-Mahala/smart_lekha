const mongoose = require('mongoose');

const seatAssignmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  shift: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, { timestamps: true });

const seatSchema = new mongoose.Schema({
  seatNumber: {
    type: String,
    required: true,
    trim: true
  },
  row: {
    type: Number,
    required: true
  },
  column: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['standard', 'premium', 'executive'],
    default: 'standard'
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved', 'maintenance', 'deleted'],
    default: 'available',
    index: true
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  library: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Library',
    required: false,
    index: true
  },
  currentAssignments: [seatAssignmentSchema],
  assignmentHistory: [seatAssignmentSchema],
  reservedUntil: {
    type: Date
  },
  reservedFor: {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    shift: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift' }
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Compound indexes
seatSchema.index({ seatNumber: 1, propertyId: 1, library: 1 }, { unique: true });
seatSchema.index({ row: 1, column: 1, propertyId: 1, library: 1 }, { unique: true });
seatSchema.index({ propertyId: 1, status: 1 });
seatSchema.index({ library: 1, status: 1 });

// Virtual for checking if seat is available
seatSchema.virtual('isAvailable').get(function() {
  return this.status === 'available' && 
         (!this.reservedUntil || new Date() > this.reservedUntil);
});

// Method to check availability for a specific shift
seatSchema.methods.isAvailableForShift = function(shiftId) {
  if (!this.isAvailable) return false;
  
  // Check if there's an active assignment for this shift
  const hasActiveAssignment = this.currentAssignments.some(
    assignment => assignment.shift.toString() === shiftId.toString() && 
                  assignment.status === 'active'
  );
  
  return !hasActiveAssignment;
};

// Method to assign student to seat
seatSchema.methods.assignStudent = async function(studentId, shiftId, assignmentData) {
  if (!this.isAvailableForShift(shiftId)) {
    throw new Error('Seat is not available for this shift');
  }

  const assignment = {
    student: studentId,
    shift: shiftId,
    startDate: assignmentData.startDate || new Date(),
    createdBy: assignmentData.createdBy,
    notes: assignmentData.notes
  };

  this.currentAssignments.push(assignment);
  
  // Update seat status if this is the first assignment
  if (this.status === 'available') {
    this.status = 'occupied';
  }
  
  await this.save();
  
  return this.currentAssignments[this.currentAssignments.length - 1];
};

// Method to release student from seat
seatSchema.methods.releaseStudent = async function(studentId, shiftId) {
  const assignmentIndex = this.currentAssignments.findIndex(
    assignment => assignment.student.toString() === studentId.toString() && 
                 assignment.shift.toString() === shiftId.toString() && 
                 assignment.status === 'active'
  );

  if (assignmentIndex === -1) {
    throw new Error('Active assignment not found');
  }

  const assignment = this.currentAssignments[assignmentIndex];
  assignment.status = 'completed';
  assignment.endDate = new Date();

  // Move to history
  this.assignmentHistory.push(assignment);
  this.currentAssignments.splice(assignmentIndex, 1);
  
  // Update seat status if no more active assignments
  if (this.currentAssignments.length === 0) {
    this.status = 'available';
    this.reservedUntil = null;
    this.reservedFor = null;
  }
  
  await this.save();
  
  return this;
};

// Method to reserve seat
seatSchema.methods.reserveSeat = async function(studentId, shiftId, until) {
  if (!this.isAvailable) {
    throw new Error('Seat is not available for reservation');
  }

  this.status = 'reserved';
  this.reservedUntil = new Date(until);
  this.reservedFor = {
    student: studentId,
    shift: shiftId
  };

  await this.save();
  
  return this;
};

// Method to cancel reservation
seatSchema.methods.cancelReservation = async function() {
  this.status = 'available';
  this.reservedUntil = null;
  this.reservedFor = null;
  
  await this.save();
  
  return this;
};

// Static method to find available seats for a shift
seatSchema.statics.findAvailableForShift = function(propertyId, shiftId, libraryId) {
  return this.find({
    propertyId: propertyId,
    library: libraryId,
    status: 'available',
    $or: [
      { 'currentAssignments.shift': { $ne: shiftId } },
      { 'currentAssignments': { $size: 0 } }
    ]
  }).populate('currentAssignments.student', 'firstName lastName');
};

// Soft delete method
seatSchema.methods.softDelete = async function() {
  const activeAssignments = this.currentAssignments.filter(a => a.status === 'active');
  if (activeAssignments.length > 0) {
    throw new Error('Cannot delete seat with active assignments');
  }

  this.status = 'deleted';
  await this.save();
  
  return this;
};

module.exports = mongoose.model('Seat', seatSchema);