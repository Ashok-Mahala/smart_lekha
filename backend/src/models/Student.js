const mongoose = require('mongoose');

const studentAssignmentSchema = new mongoose.Schema({
  seat: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Seat',
    required: true 
  },
  shift: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Shift',
    required: true 
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
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
  payment: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Payment' 
  },
  feeDetails: {
    amount: Number,
    collected: Number,
    balance: Number
  }
}, { timestamps: true });

const studentSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[0-9]{10,15}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  institution: {
    type: String,
    trim: true
  },
  course: {
    type: String,
    trim: true
  },
  aadharNumber: {
    type: String, // Changed from Number to String
    trim: true,
    validate: {
      validator: function(v) {
        return /^[0-9]{12}$/.test(v);
      },
      message: props => `${props.value} is not a valid Aadhar number!`
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  currentAssignments: [studentAssignmentSchema],
  assignmentHistory: [studentAssignmentSchema],
  documents: [{
    type: {
      type: String,
      enum: ['profile_photo', 'identity_proof', 'aadhar_card', 'other'],
      required: true
    },
    url: String,
    originalName: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Virtual for full name
studentSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`.trim();
});

// Virtual for active assignments count - FIXED
studentSchema.virtual('activeAssignmentsCount').get(function() {
  // Add null check to prevent the error
  if (!this.currentAssignments || !Array.isArray(this.currentAssignments)) {
    return 0;
  }
  return this.currentAssignments.filter(a => a.status === 'active').length;
});

// Static method to find students with active assignments
studentSchema.statics.findWithActiveAssignments = function() {
  return this.find({ 
    'currentAssignments.status': 'active',
    status: 'active'
  });
};

// Methods
studentSchema.methods.assignToSeat = async function(seatId, shiftId, assignmentData) {
  const Seat = mongoose.model('Seat');
  const seat = await Seat.findById(seatId);
  
  if (!seat) throw new Error('Seat not found');
  
  // Create assignment
  const assignment = {
    seat: seatId,
    shift: shiftId,
    property: seat.propertyId,
    startDate: assignmentData.startDate || new Date(),
    feeDetails: assignmentData.feeDetails,
    payment: assignmentData.payment
  };

  // Add null check for currentAssignments
  if (!this.currentAssignments) {
    this.currentAssignments = [];
  }
  
  this.currentAssignments.push(assignment);
  await this.save();
  
  return this;
};

studentSchema.methods.releaseFromSeat = async function(seatId, shiftId) {
  const assignmentIndex = this.currentAssignments.findIndex(
    assignment => assignment.seat.toString() === seatId.toString() && 
    assignment.shift.toString() === shiftId.toString() && 
    assignment.status === 'active'
  );

  if (assignmentIndex === -1) {
    throw new Error('Active assignment not found');
  }

  const assignment = this.currentAssignments[assignmentIndex];
  assignment.status = 'completed';
  assignment.endDate = new Date();

  // Add null check for assignmentHistory
  if (!this.assignmentHistory) {
    this.assignmentHistory = [];
  }

  // Move to history
  this.assignmentHistory.push(assignment);
  this.currentAssignments.splice(assignmentIndex, 1);
  
  await this.save();
  
  return this;
};

studentSchema.methods.cancelAssignment = async function(seatId, shiftId) {
  const assignmentIndex = this.currentAssignments.findIndex(
    assignment => assignment.seat.toString() === seatId.toString() && 
    assignment.shift.toString() === shiftId.toString() && 
    assignment.status === 'active'
  );

  if (assignmentIndex === -1) {
    throw new Error('Active assignment not found');
  }

  const assignment = this.currentAssignments[assignmentIndex];
  assignment.status = 'cancelled';
  assignment.endDate = new Date();

  // Add null check for assignmentHistory
  if (!this.assignmentHistory) {
    this.assignmentHistory = [];
  }

  // Move to history
  this.assignmentHistory.push(assignment);
  this.currentAssignments.splice(assignmentIndex, 1);
  
  await this.save();
  
  return this;
};

module.exports = mongoose.model('Student', studentSchema);