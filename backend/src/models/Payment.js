const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  type: {
    type: String,
    enum: ['seat_booking', 'membership', 'fine', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank_transfer', 'other'],
    required: true
  },
  paymentDetails: {
    transactionId: String,
    paymentDate: Date,
    receiptNumber: String,
    cardLast4: String,
    cardBrand: String
  },
  refundDetails: {
    amount: Number,
    reason: String,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    processedAt: Date
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
paymentSchema.index({ student: 1 });
paymentSchema.index({ booking: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ 'paymentDetails.transactionId': 1 });
paymentSchema.index({ createdAt: 1 });

// Method to process refund
paymentSchema.methods.processRefund = async function(userId, reason) {
  if (this.status !== 'completed') {
    throw new Error('Only completed payments can be refunded');
  }

  this.status = 'refunded';
  this.refundDetails = {
    amount: this.amount,
    reason,
    processedBy: userId,
    processedAt: new Date()
  };

  return this.save();
};

// Static method to get payment statistics
paymentSchema.statics.getStats = async function(startDate, endDate) {
  const stats = await this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  return stats.reduce((acc, curr) => {
    acc[curr._id] = {
      totalAmount: curr.totalAmount,
      count: curr.count
    };
    return acc;
  }, {});
};

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment; 