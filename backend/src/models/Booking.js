const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  seat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seat',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  type: {
    type: String,
    enum: ['regular', 'temporary', 'emergency'],
    default: 'regular'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank_transfer', 'other'],
    required: true
  },
  paymentDetails: {
    transactionId: String,
    paymentDate: Date,
    receiptNumber: String
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationReason: String,
  cancellationDate: Date
}, {
  timestamps: true
});

// Indexes
bookingSchema.index({ student: 1 });
bookingSchema.index({ seat: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ startDate: 1, endDate: 1 });
bookingSchema.index({ paymentStatus: 1 });

// Method to check if booking is active
bookingSchema.methods.isActive = function() {
  const now = new Date();
  return this.status === 'confirmed' && 
         this.startDate <= now && 
         this.endDate >= now;
};

// Method to cancel booking
bookingSchema.methods.cancel = async function(userId, reason) {
  if (this.status !== 'confirmed') {
    throw new Error('Only confirmed bookings can be cancelled');
  }

  this.status = 'cancelled';
  this.cancelledBy = userId;
  this.cancellationReason = reason;
  this.cancellationDate = new Date();

  // Release the seat
  const Seat = mongoose.model('Seat');
  await Seat.findByIdAndUpdate(this.seat, { status: 'available' });

  return this.save();
};

// Static method to check seat availability
bookingSchema.statics.checkAvailability = async function(seatId, startDate, endDate) {
  const conflictingBooking = await this.findOne({
    seat: seatId,
    status: 'confirmed',
    $or: [
      {
        startDate: { $lte: endDate },
        endDate: { $gte: startDate }
      }
    ]
  });

  return !conflictingBooking;
};

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking; 