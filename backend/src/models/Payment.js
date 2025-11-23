const mongoose = require('mongoose');

const paymentInstallmentSchema = new mongoose.Schema({
  installmentNumber: {
    type: Number,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'online', 'bank_transfer'],
    required: true
  },
  transactionId: {
    type: String,
    trim: true
  },
  paymentDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  collectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  description: {
    type: String,
    maxlength: 500
  },
  receiptNumber: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['completed', 'failed'],
    default: 'completed'
  }
}, { timestamps: true });

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
  library: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Library',
    required: false,
    index: true
  },
  // Total expected amount for this payment period
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  // Total collected so far (sum of all installments)
  totalCollected: {
    type: Number,
    default: 0,
    min: 0
  },
  // Remaining balance
  balanceAmount: {
    type: Number,
    default: function() {
      return this.totalAmount - this.totalCollected;
    },
    min: 0
  },
  // Overall payment status
  status: {
    type: String,
    enum: ['pending', 'completed', 'partial', 'overdue', 'cancelled'],
    default: 'pending',
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'online', 'bank_transfer'],
    default: 'cash'
  },
  transactionId: {
    type: String,
    trim: true,
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
  // Track all installments
  installments: [paymentInstallmentSchema],
  
  // Payment summary for quick access
  paymentSummary: {
    totalInstallments: { type: Number, default: 0 },
    lastPaymentDate: Date,
    firstPaymentDate: Date
  },
  
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

// Indexes for better query performance
paymentSchema.index({ student: 1, status: 1 });
paymentSchema.index({ property: 1, dueDate: 1 });
paymentSchema.index({ dueDate: 1 });
paymentSchema.index({ library: 1, status: 1 });
paymentSchema.index({ assignment: 1 });
paymentSchema.index({ createdAt: 1 });
paymentSchema.index({ library: 1, student: 1 });
paymentSchema.index({ 'installments.paymentDate': 1 });

// Virtual for payment status
paymentSchema.virtual('isOverdue').get(function() {
  return this.status === 'pending' && new Date() > this.dueDate;
});

paymentSchema.virtual('daysOverdue').get(function() {
  if (!this.isOverdue) return 0;
  return Math.ceil((new Date() - this.dueDate) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to update calculated fields
paymentSchema.pre('save', function(next) {
  // Update balance amount
  this.balanceAmount = this.totalAmount - this.totalCollected;
  
  // Update payment summary
  this.paymentSummary.totalInstallments = this.installments.length;
  
  if (this.installments.length > 0) {
    const sortedInstallments = this.installments.sort((a, b) => new Date(a.paymentDate) - new Date(b.paymentDate));
    this.paymentSummary.firstPaymentDate = sortedInstallments[0].paymentDate;
    this.paymentSummary.lastPaymentDate = sortedInstallments[sortedInstallments.length - 1].paymentDate;
    
    // Set main payment date and method from last installment
    this.paymentDate = this.paymentSummary.lastPaymentDate;
    this.paymentMethod = sortedInstallments[sortedInstallments.length - 1].paymentMethod;
    this.transactionId = sortedInstallments[sortedInstallments.length - 1].transactionId;
  }
  
  // Update overall status
  if (this.totalCollected === 0) {
    this.status = this.isOverdue ? 'overdue' : 'pending';
  } else if (this.totalCollected === this.totalAmount) {
    this.status = 'completed';
  } else if (this.totalCollected > 0 && this.totalCollected < this.totalAmount) {
    this.status = this.isOverdue ? 'overdue' : 'partial';
  }
  
  next();
});

// Instance method to add an installment payment
paymentSchema.methods.addInstallment = async function(paymentData) {
  const {
    amount,
    paymentMethod,
    transactionId,
    paymentDate,
    collectedBy,
    description,
    receiptNumber,
    notes
  } = paymentData;

  if (amount <= 0) {
    throw new Error('Payment amount must be greater than 0');
  }

  if (this.totalCollected + amount > this.totalAmount) {
    throw new Error(`Payment amount exceeds total due. Remaining balance: ${this.balanceAmount}`);
  }

  const installmentNumber = this.installments.length + 1;

  const installment = {
    installmentNumber,
    amount,
    paymentMethod,
    transactionId: transactionId || `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    paymentDate: paymentDate || new Date(),
    collectedBy: collectedBy || this.createdBy,
    description: description || `Installment ${installmentNumber} for ${this.feeType}`,
    receiptNumber: receiptNumber || `RCPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    status: 'completed'
  };

  this.installments.push(installment);
  this.totalCollected += amount;

  if (notes) {
    this.notes = this.notes ? `${this.notes}\n${new Date().toLocaleDateString()}: ${notes}` : notes;
  }

  return this.save();
};

// Instance method to get payment history
paymentSchema.methods.getPaymentHistory = function() {
  return this.installments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
};

// Instance method to calculate payment progress
paymentSchema.methods.getPaymentProgress = function() {
  const progress = (this.totalCollected / this.totalAmount) * 100;
  return {
    percentage: Math.round(progress * 100) / 100,
    paid: this.totalCollected,
    balance: this.balanceAmount,
    total: this.totalAmount,
    installments: this.installments.length
  };
};

// Static methods
paymentSchema.statics.findByLibrary = function(libraryId) {
  return this.find({ library: libraryId })
    .populate('student', 'firstName lastName email phone')
    .populate('seat', 'seatNumber row column type')
    .populate('shift', 'name startTime endTime')
    .populate('property', 'name address')
    .populate('createdBy', 'name email');
};

paymentSchema.statics.findByAssignment = function(assignmentId) {
  return this.find({ assignment: assignmentId })
    .populate('student', 'firstName lastName email phone')
    .populate('seat', 'seatNumber')
    .populate('shift', 'name');
};

paymentSchema.statics.findByStudent = function(studentId) {
  return this.find({ student: studentId })
    .populate('seat', 'seatNumber row column')
    .populate('shift', 'name startTime endTime')
    .populate('property', 'name address')
    .sort({ dueDate: 1 });
};

paymentSchema.statics.findOverdue = function(libraryId = null) {
  const query = { 
    status: { $in: ['pending', 'partial', 'overdue'] }, 
    dueDate: { $lt: new Date() } 
  };
  
  if (libraryId) query.library = libraryId;
  
  return this.find(query)
    .populate('student', 'firstName lastName email phone')
    .populate('seat', 'seatNumber')
    .populate('shift', 'name');
};

paymentSchema.statics.getLibraryRevenue = function(libraryId, startDate, endDate) {
  const match = { 
    library: libraryId,
    status: { $in: ['completed', 'partial'] }
  };
  
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' }
        },
        totalRevenue: { $sum: '$totalCollected' },
        totalDue: { $sum: '$totalAmount' },
        paymentCount: { $sum: 1 },
        completedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);
};

paymentSchema.statics.getPaymentSummary = function(libraryId, startDate, endDate) {
  const match = { library: libraryId };
  
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
        totalAmount: { $sum: '$totalAmount' },
        totalCollected: { $sum: '$totalCollected' },
        totalBalance: { $sum: '$balanceAmount' }
      }
    }
  ]);
};

// Create or update payment for assignment
paymentSchema.statics.createOrUpdatePayment = async function(paymentData) {
  const {
    student,
    seat,
    shift,
    property,
    assignment,
    library,
    totalAmount,
    dueDate,
    period,
    feeType = 'seat_rent',
    description,
    createdBy
  } = paymentData;

  // Check if payment already exists for this assignment
  let payment = await this.findOne({ assignment, library });

  if (payment) {
    // Update existing payment
    payment.totalAmount = totalAmount;
    payment.dueDate = dueDate;
    payment.period = period;
    payment.description = description;
    
    // Recalculate balance
    payment.balanceAmount = payment.totalAmount - payment.totalCollected;
    
    return payment.save();
  } else {
    // Create new payment
    return this.create({
      student,
      seat,
      shift,
      property,
      assignment,
      library,
      totalAmount,
      dueDate,
      period,
      feeType,
      description: description || `Payment for ${feeType.replace('_', ' ')}`,
      createdBy
    });
  }
};

module.exports = mongoose.model('Payment', paymentSchema);