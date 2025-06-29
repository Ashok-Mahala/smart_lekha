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
    ref: 'Shift',
    required: true
  },
  startDate: { type: Date, required: true },
  endDate: Date,
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
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
  },
  idempotencyKey: {
    type: String,
    unique: true
  }
}, {
  timestamps: true
});

// Indexes
bookingSchema.index({ seat: 1 });
bookingSchema.index({ student: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ startDate: 1 });
bookingSchema.index({ shift: 1 });
bookingSchema.index({ idempotencyKey: 1 }, { unique: true });

// Unique active booking per seat per shift
bookingSchema.index(
  { seat: 1, shift: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'active' }
  }
);

// Add to currentStudents on save
bookingSchema.post('save', async function(doc, next) {
  try {
    if (doc.status === 'active') {
      const seat = await mongoose.model('Seat').findById(doc.seat);
      if (seat) {
        await seat.addCurrentStudent(doc.student, doc._id, doc.shift);
      }
    }
    next();
  } catch (err) {
    next(err);
  }
});

// Remove from currentStudents if cancelled or completed
bookingSchema.pre('save', async function(next) {
  if (this.isModified('status') && ['completed', 'cancelled'].includes(this.status)) {
    await mongoose.model('Seat').findByIdAndUpdate(this.seat, {
      $pull: { currentStudents: { booking: this._id } },
      $set: { status: 'available' }
    });
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
