const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved', 'maintenance', 'deleted'],
    default: 'available'
  },
  reservedUntil: Date,
  seatNumber: {
    type: String,
    required: true,
    trim: true,
    unique: false
  },
  row: { type: Number, required: true },
  column: { type: Number, required: true },
  type: {
    type: String,
    enum: ['standard', 'premium', 'handicap', 'other'],
    default: 'standard'
  },
  features: [{
    type: String,
    enum: ['power_outlet', 'table', 'extra_space', 'window', 'aisle']
  }],
  currentStudents: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    shift: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift' }
  }],
  lastAssigned: {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    date: Date
  },
  maintenanceHistory: [{
    date: Date,
    description: String,
    performedBy: String
  }],
  notes: String,
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// REMOVE broken array uniqueness index
// seatSchema.index({ _id: 1, "currentStudents.shift": 1 }, { unique: true, partialFilterExpression: { "currentStudents.shift": { $exists: true } } });

// Indexes
seatSchema.index({ propertyId: 1 });
seatSchema.index({ status: 1 });
seatSchema.index({ type: 1 });
seatSchema.index({ deletedAt: 1 });

seatSchema.index({ propertyId: 1, seatNumber: 1 }, { unique: true });
seatSchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'seat'
});

seatSchema.pre(/^find/, function(next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }
  next();
});

seatSchema.methods.isAvailable = function() {
  return this.status === 'available' && !this.deletedAt;
};

seatSchema.methods.addCurrentStudent = async function(studentId, bookingId, shiftId) {
  const exists = this.currentStudents.some(cs =>
    cs.booking.toString() === bookingId.toString() ||
    (cs.student.toString() === studentId.toString() && cs.shift.toString() === shiftId.toString())
  );
  if (!exists) {
    this.currentStudents.push({ student: studentId, booking: bookingId, shift: shiftId });
    this.status = 'occupied';
    await this.save();
  }
};

seatSchema.methods.release = function() {
  this.currentStudent = null;
  this.status = 'available';
  return this.save();
};

seatSchema.methods.softDelete = function() {
  this.status = 'deleted';
  this.deletedAt = new Date();
  return this.save();
};

seatSchema.methods.reactivate = function() {
  this.status = 'available';
  this.deletedAt = null;
  return this.save();
};

seatSchema.statics.bulkReactivate = async function(seatIds) {
  return this.updateMany(
    { _id: { $in: seatIds } },
    { $set: { status: 'available' }, $unset: { deletedAt: 1 } }
  );
};

seatSchema.statics.bulkSoftDelete = async function(seatIds) {
  return this.updateMany(
    { _id: { $in: seatIds } },
    { $set: { status: 'deleted', deletedAt: new Date() } }
  );
};

module.exports = mongoose.model('Seat', seatSchema);
