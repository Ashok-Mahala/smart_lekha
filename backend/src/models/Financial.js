const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FinancialSchema = new Schema({
  type: {
    type: String,
    enum: ['payment', 'refund', 'adjustment'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    required: true
  },
  reference: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking'
  },
  metadata: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes
FinancialSchema.index({ studentId: 1 });
FinancialSchema.index({ bookingId: 1 });
FinancialSchema.index({ status: 1 });
FinancialSchema.index({ createdAt: 1 });

// Virtual for formatted amount
FinancialSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency
  }).format(this.amount);
});

// Methods
FinancialSchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.formattedAmount = this.formattedAmount;
  return obj;
};

module.exports = mongoose.model('Financial', FinancialSchema); 