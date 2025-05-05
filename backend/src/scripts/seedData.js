const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config');
const User = require('../models/User');
const Student = require('../models/student.model');
const Seat = require('../models/Seat');
const Booking = require('../models/Booking');
const Payment = require('../models/payment.model');

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);

    // Clear existing data
    await Student.deleteMany({});
    await Seat.deleteMany({});
    await Booking.deleteMany({});
    await Payment.deleteMany({});

    console.log('Cleared existing data');

    // Create seats
    const seats = [];

    await Seat.insertMany(seats);
    console.log('Created seats');

    // Create bookings
    const bookings = [];

    await Booking.insertMany(bookings);
    console.log('Created bookings');

    // Create payments
    const payments = [];

    await Payment.insertMany(payments);
    console.log('Created payments');

    console.log('Data seeding completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
};

seedData(); 