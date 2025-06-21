const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  seat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seat',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  shift: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: Date,
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
  }
}, {
  timestamps: true
});

// Add indexes
bookingSchema.index({ seat: 1 });
bookingSchema.index({ student: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ startDate: 1 });

// Middleware to handle seat status changes
bookingSchema.post('save', async function(doc) {
  if (doc.status === 'active') {
    await mongoose.model('Seat').findByIdAndUpdate(doc.seat, {
      status: 'occupied',
      currentStudent: doc.student
    });
  }
});

// Middleware to release seat when booking is completed/cancelled
bookingSchema.pre('save', async function(next) {
  if (this.isModified('status') && ['completed', 'cancelled'].includes(this.status)) {
    await mongoose.model('Seat').findByIdAndUpdate(this.seat, {
      status: 'available',
      currentStudent: null
    });
  }
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;