// models/Payment.js
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
    required: true
  },
  amount: {
    type: Number,
    required: true,
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
    trim: true
  },
  paymentDate: {
    type: Date,
    default: Date.now
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

// Virtual for payment status
paymentSchema.virtual('isOverdue').get(function() {
  return this.status === 'pending' && new Date() > this.dueDate;
});

paymentSchema.virtual('totalPaid').get(function() {
  if (this.status === 'completed') return this.amount;
  if (this.status === 'partial') return this.paymentBreakdown
    .filter(p => p.type !== 'discount')
    .reduce((sum, p) => sum + p.amount, 0);
  return 0;
});

// Static methods
paymentSchema.statics.findByProperty = function(propertyId) {
  return this.find({ property: propertyId })
    .populate('student', 'firstName lastName email phone')
    .populate('seat', 'seatNumber')
    .populate('shift', 'name');
};

paymentSchema.statics.findCompleted = function() {
  return this.find({ status: 'completed' });
};

paymentSchema.statics.findPending = function() {
  return this.find({ status: 'pending' });
};

paymentSchema.statics.findOverdue = function() {
  return this.find({ 
    status: 'pending', 
    dueDate: { $lt: new Date() } 
  });
};

paymentSchema.statics.getPropertyRevenue = function(propertyId, startDate, endDate) {
  const match = { 
    property: propertyId, 
    status: 'completed',
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
        totalRevenue: { $sum: '$amount' },
        paymentCount: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);
};

// Middleware to update assignment when payment is completed
paymentSchema.post('save', async function(doc) {
  if (doc.status === 'completed' || doc.status === 'partial') {
    const Student = mongoose.model('Student');
    const Seat = mongoose.model('Seat');
    
    const paidAmount = doc.totalPaid;
    
    // Update student assignment
    await Student.updateOne(
      { 
        _id: doc.student,
        'currentAssignments._id': doc.assignment 
      },
      { 
        $set: { 
          'currentAssignments.$.payment': doc._id,
          'currentAssignments.$.feeDetails.collected': paidAmount,
          'currentAssignments.$.feeDetails.balance': doc.amount - paidAmount
        } 
      }
    );
    
    // Update seat assignment
    await Seat.updateOne(
      { 
        'currentAssignments.student': doc.student,
        'currentAssignments.shift': doc.shift 
      },
      { 
        $set: { 
          'currentAssignments.$.payment': doc._id,
          'currentAssignments.$.feeDetails.collected': paidAmount,
          'currentAssignments.$.feeDetails.balance': doc.amount - paidAmount
        } 
      }
    );
  }
});

module.exports = mongoose.model('Payment', paymentSchema);