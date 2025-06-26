const mongoose = require('mongoose');

const seatLayoutSchema = new mongoose.Schema({
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Property'
  },
  rows: {
    type: Number,
    required: true
  },
  columns: {
    type: Number,
    required: true
  },
  aisleWidth: {
    type: Number,
    default: 2
  },
  seatWidth: {
    type: Number,
    default: 1
  },
  seatHeight: {
    type: Number,
    default: 1
  },
  gap: {
    type: Number,
    default: 1
  },
  showNumbers: {
    type: Boolean,
    default: true
  },
  showStatus: {
    type: Boolean,
    default: true
  },
  numberingDirection: {
    type: String,
    enum: ['horizontal', 'vertical'],
    default: 'horizontal'
  },
  layout: {
    type: [[Boolean]],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const SeatLayout = mongoose.model('SeatLayout', seatLayoutSchema);

module.exports = SeatLayout; 