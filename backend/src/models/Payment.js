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
    enum: ['pending', 'completed', 'failed', 'refunded'],
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
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Indexes
paymentSchema.index({ student: 1, status: 1 });
paymentSchema.index({ paymentDate: 1 });
paymentSchema.index({ dueDate: 1 });
paymentSchema.index({ student: 1, shift: 1, period: 1 });

// Virtual for payment status
paymentSchema.virtual('isOverdue').get(function() {
  return this.status === 'pending' && new Date() > this.dueDate;
});

// Static methods
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

// Middleware to update assignment when payment is completed
paymentSchema.post('save', async function(doc) {
  if (doc.status === 'completed') {
    const Student = mongoose.model('Student');
    const Seat = mongoose.model('Seat');
    
    // Update student assignment
    await Student.updateOne(
      { 
        _id: doc.student,
        'currentAssignments._id': doc.assignment 
      },
      { 
        $set: { 
          'currentAssignments.$.payment': doc._id,
          'currentAssignments.$.feeDetails.collected': doc.amount
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
          'currentAssignments.$.feeDetails.collected': doc.amount
        } 
      }
    );
  }
});

module.exports = mongoose.model('Payment', paymentSchema);