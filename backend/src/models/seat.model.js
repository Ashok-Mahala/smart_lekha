const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const seatSchema = new Schema({
  seatNumber: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'maintenance'],
    default: 'available'
  },
  type: {
    type: String,
    enum: ['regular', 'premium', 'group'],
    default: 'regular'
  },
  price: {
    type: Number,
    required: true
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'Student'
  },
  bookingStart: {
    type: Date
  },
  bookingEnd: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Seat', seatSchema); 