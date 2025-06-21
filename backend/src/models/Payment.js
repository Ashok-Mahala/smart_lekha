const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    index: true
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
paymentSchema.index({ booking: 1, status: 1 });
paymentSchema.index({ paymentDate: 1 });

// Middleware to update booking when payment is completed
paymentSchema.post('save', async function(doc) {
  if (doc.status === 'completed') {
    const Booking = mongoose.model('Booking');
    await Booking.findByIdAndUpdate(doc.booking, {
      $set: { status: 'active' }
    });
  }
});

// Static method to find completed payments
paymentSchema.statics.findCompleted = function() {
  return this.find({ status: 'completed' });
};

module.exports = mongoose.model('Payment', paymentSchema);