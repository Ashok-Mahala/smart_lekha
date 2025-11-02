const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
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
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  collectedAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  balanceAmount: {
    type: Number,
    default: function() {
      return this.amount - this.collectedAmount;
    },
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'partial'],
    default: 'pending',
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'online', 'bank_transfer'],
    required: true
  },
  transactionId: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  paymentDate: {
    type: Date
  },
  dueDate: {
    type: Date,
    required: true
  },
  period: {
    start: { type: Date, required: true },
    end: { type: Date, required: true }
  },
  feeType: {
    type: String,
    enum: ['seat_rent', 'security_deposit', 'maintenance', 'other'],
    default: 'seat_rent'
  },
  description: {
    type: String,
    maxlength: 500
  },
  paymentBreakdown: [{
    description: String,
    amount: Number,
    type: {
      type: String,
      enum: ['base_fee', 'tax', 'discount', 'penalty', 'other']
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    maxlength: 500
  },
  refundDetails: {
    amount: Number,
    reason: String,
    refundDate: Date,
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
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

// Indexes
paymentSchema.index({ student: 1, status: 1 });
paymentSchema.index({ property: 1, paymentDate: 1 });
paymentSchema.index({ dueDate: 1 });
paymentSchema.index({ student: 1, shift: 1, period: 1 });
paymentSchema.index({ property: 1, status: 1 });
paymentSchema.index({ createdAt: 1 });
paymentSchema.index({ assignment: 1, status: 1 });

// Virtual for payment status
paymentSchema.virtual('isOverdue').get(function() {
  return this.status === 'pending' && new Date() > this.dueDate;
});

paymentSchema.virtual('daysOverdue').get(function() {
  if (!this.isOverdue) return 0;
  return Math.ceil((new Date() - this.dueDate) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to calculate balance
paymentSchema.pre('save', function(next) {
  if (this.isModified('collectedAmount') || this.isModified('amount')) {
    this.balanceAmount = this.amount - this.collectedAmount;
    
    // Update status based on collected amount
    if (this.collectedAmount === 0) {
      this.status = 'pending';
    } else if (this.collectedAmount === this.amount) {
      this.status = 'completed';
    } else if (this.collectedAmount > 0 && this.collectedAmount < this.amount) {
      this.status = 'partial';
    }
  }
  next();
});

// Static methods
paymentSchema.statics.findByProperty = function(propertyId) {
  return this.find({ property: propertyId })
    .populate('student', 'firstName lastName email phone')
    .populate('seat', 'seatNumber row column type')
    .populate('shift', 'name startTime endTime fee')
    .populate('createdBy', 'name email');
};

paymentSchema.statics.findByAssignment = function(assignmentId) {
  return this.find({ assignment: assignmentId })
    .populate('student', 'firstName lastName email phone')
    .populate('seat', 'seatNumber')
    .populate('shift', 'name');
};

paymentSchema.statics.findCompleted = function() {
  return this.find({ status: 'completed' })
    .populate('student', 'firstName lastName')
    .populate('seat', 'seatNumber')
    .populate('shift', 'name');
};

paymentSchema.statics.findPending = function() {
  return this.find({ status: 'pending' })
    .populate('student', 'firstName lastName')
    .populate('seat', 'seatNumber')
    .populate('shift', 'name');
};

paymentSchema.statics.findOverdue = function() {
  return this.find({ 
    status: 'pending', 
    dueDate: { $lt: new Date() } 
  })
  .populate('student', 'firstName lastName email phone')
  .populate('seat', 'seatNumber')
  .populate('shift', 'name');
};

paymentSchema.statics.getPropertyRevenue = function(propertyId, startDate, endDate) {
  const match = { 
    property: propertyId, 
    status: { $in: ['completed', 'partial'] },
    paymentDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
  };
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          month: { $month: '$paymentDate' },
          year: { $year: '$paymentDate' }
        },
        totalRevenue: { $sum: '$collectedAmount' },
        totalDue: { $sum: '$amount' },
        paymentCount: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);
};

paymentSchema.statics.getPaymentSummary = function(propertyId, startDate, endDate) {
  const match = { 
    status: { $in: ['completed', 'partial', 'pending'] }
  };
  
  if (propertyId) match.property = propertyId;
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        collectedAmount: { $sum: '$collectedAmount' },
        balanceAmount: { $sum: '$balanceAmount' }
      }
    }
  ]);
};

// Instance method to add payment
paymentSchema.methods.addPayment = async function(amount, method, transactionId, notes = '') {
  if (amount <= 0) {
    throw new Error('Payment amount must be greater than 0');
  }

  if (this.collectedAmount + amount > this.amount) {
    throw new Error('Payment amount exceeds total due');
  }

  this.collectedAmount += amount;
  this.balanceAmount = this.amount - this.collectedAmount;
  
  // Add to payment breakdown
  this.paymentBreakdown.push({
    description: `Payment via ${method}`,
    amount: amount,
    type: 'base_fee',
    date: new Date()
  });

  // Update status
  if (this.collectedAmount === this.amount) {
    this.status = 'completed';
    this.paymentDate = new Date();
  } else if (this.collectedAmount > 0) {
    this.status = 'partial';
  }

  if (transactionId) {
    this.transactionId = transactionId;
  }

  if (notes) {
    this.notes = notes;
  }

  return this.save();
};

// Instance method to get payment history for a student
paymentSchema.statics.getStudentPaymentHistory = function(studentId) {
  return this.find({ student: studentId })
    .populate('seat', 'seatNumber row column type')
    .populate('shift', 'name startTime endTime')
    .populate('property', 'name address')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('Payment', paymentSchema);