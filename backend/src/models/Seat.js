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
    required: true,
    default: Date.now 
  },
  endDate: { 
    type: Date 
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  payment: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Payment' 
  },
  documents: [{
    type: {
      type: String,
      enum: ['profile_photo', 'identity_proof', 'aadhar_card']
    },
    url: String,
    originalName: String
  }],
  feeDetails: {
    amount: Number,
    collected: Number,
    balance: Number
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

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
  row: { type: Number, required: true },
  column: { type: Number, required: true },
  type: {
    type: String,
    enum: ['standard', 'premium', 'handicap', 'other'],
    default: 'standard'
  },
  features: [{
    type: String,
    enum: ['power_outlet', 'table', 'extra_space', 'window', 'aisle']
  }],
  currentAssignments: [seatAssignmentSchema],
  assignmentHistory: [seatAssignmentSchema],
  lastAssigned: {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
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
seatSchema.index({ status: 1 });
seatSchema.index({ type: 1 });
seatSchema.index({ deletedAt: 1 });
seatSchema.index({ propertyId: 1, seatNumber: 1 }, { unique: true });

// Unique active assignment per seat per shift
seatSchema.index(
  { "currentAssignments.shift": 1, "currentAssignments.status": 1 },
  {
    partialFilterExpression: { "currentAssignments.status": "active" }
  }
);

// Virtual for current students count
seatSchema.virtual('currentStudentsCount').get(function() {
  if (!this.currentAssignments || !Array.isArray(this.currentAssignments)) {
    return 0;
  }
  return this.currentAssignments.filter(a => a.status === 'active').length;
});

seatSchema.pre(/^find/, function(next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }
  next();
});

// Methods
seatSchema.methods.isAvailableForShift = function(shiftId) {
  if (this.status !== 'available') return false;
  
  const activeAssignment = this.currentAssignments.find(
    assignment => assignment.shift.toString() === shiftId.toString() && 
    assignment.status === 'active'
  );
  
  return !activeAssignment;
};

seatSchema.methods.assignStudent = async function(studentId, shiftId, assignmentData) {
  if (!this.isAvailableForShift(shiftId)) {
    throw new Error('Seat not available for this shift');
  }

  const assignment = {
    student: studentId,
    shift: shiftId,
    startDate: assignmentData.startDate || new Date(),
    feeDetails: assignmentData.feeDetails,
    documents: assignmentData.documents || [],
    createdBy: assignmentData.createdBy
  };

  this.currentAssignments.push(assignment);
  this.status = 'occupied';
  this.lastAssigned = {
    student: studentId,
    date: new Date()
  };

  return this.save();
};

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

  // Update seat status if no active assignments
  if (this.currentAssignments.length === 0) {
    this.status = 'available';
  }

  return this.save();
};

seatSchema.methods.cancelAssignment = async function(studentId, shiftId) {
  const assignmentIndex = this.currentAssignments.findIndex(
    assignment => assignment.student.toString() === studentId.toString() && 
    assignment.shift.toString() === shiftId.toString() && 
    assignment.status === 'active'
  );

  if (assignmentIndex === -1) {
    throw new Error('Active assignment not found');
  }

  const assignment = this.currentAssignments[assignmentIndex];
  assignment.status = 'cancelled';
  assignment.endDate = new Date();

  // Move to history
  this.assignmentHistory.push(assignment);
  this.currentAssignments.splice(assignmentIndex, 1);

  // Update seat status if no active assignments
  if (this.currentAssignments.length === 0) {
    this.status = 'available';
  }

  return this.save();
};

seatSchema.methods.softDelete = function() {
  this.status = 'deleted';
  this.deletedAt = new Date();
  return this.save();
};

seatSchema.methods.reactivate = function() {
  this.status = 'available';
  this.deletedAt = null;
  return this.save();
};

module.exports = mongoose.model('Seat', seatSchema);