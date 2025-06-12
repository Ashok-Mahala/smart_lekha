const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  latitude: { type: Number },
  longitude: { type: Number },
  phone: { type: String, trim: true },
  email: { type: String, trim: true },
  website: { type: String, trim: true },
  description: { type: String },
  openingHours: { type: String },
  totalSeats: { type: Number, default: 0 },
  facilities: [{ type: String }],
  rules: [{ type: String }],
  manager: {
    name: { type: String },
    role: { type: String },
    email: { type: String },
    phone: { type: String },
    avatar: { type: String }
  },
  images: [{ type: String }],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const Property = mongoose.model('Property', propertySchema);

module.exports = Property; 