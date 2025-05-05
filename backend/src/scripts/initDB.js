const mongoose = require('mongoose');
const { config } = require('../config');
const User = require('../models/User');
const Student = require('../models/Student');
const Seat = require('../models/Seat');
const Booking = require('../models/Booking');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');
const Report = require('../models/Report');
const Operation = require('../models/Operation');

const initializeDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Student.deleteMany({}),
      Seat.deleteMany({}),
      Booking.deleteMany({}),
      Attendance.deleteMany({}),
      Payment.deleteMany({}),
      Report.deleteMany({}),
      Operation.deleteMany({})
    ]);
    console.log('Cleared existing data');

    // Create admin user
    const adminUser = new User({
      email: 'admin@example.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
        role: 'admin',
      isActive: true
    });
    await adminUser.save();
    console.log('Created admin user');

    // Create regular user
    const regularUser = new User({
      email: 'user@example.com',
      password: 'user123',
      firstName: 'Regular',
      lastName: 'User',
      role: 'user',
      isActive: true
    });
    await regularUser.save();
    console.log('Created regular user');

    // Create sample students
    const students = await Student.insertMany([
      {
        studentId: 'STU001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
        dateOfBirth: new Date('2000-01-01'),
        gender: 'male',
        course: 'Computer Science',
        batch: '2023',
        status: 'active'
      },
      {
        studentId: 'STU002',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '0987654321',
        dateOfBirth: new Date('2001-02-02'),
        gender: 'female',
        course: 'Business',
        batch: '2023',
        status: 'active'
      }
    ]);
    console.log('Created sample students');

    // Create sample seats
    const seats = await Seat.insertMany([
      {
        seatNumber: 'A1',
        row: 'A',
        column: 1,
        type: 'standard',
        features: ['power_outlet', 'table']
      },
      {
        seatNumber: 'A2',
        row: 'A',
        column: 2,
        type: 'premium',
        features: ['power_outlet', 'table', 'extra_space']
      }
    ]);
    console.log('Created sample seats');

    // Create sample bookings
    const bookings = await Booking.insertMany([
      {
        student: students[0]._id,
        seat: seats[0]._id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'confirmed',
        type: 'regular',
        paymentStatus: 'paid',
        amount: 100,
        paymentMethod: 'card',
        createdBy: adminUser._id
      }
    ]);
    console.log('Created sample bookings');

    // Create sample attendance records
    const attendance = await Attendance.insertMany([
      {
        student: students[0]._id,
        date: new Date(),
        status: 'present',
        checkIn: {
          time: new Date(),
          location: 'main_entrance'
        },
        recordedBy: adminUser._id
      }
    ]);
    console.log('Created sample attendance records');

    // Create sample payments
    const payments = await Payment.insertMany([
      {
        student: students[0]._id,
        booking: bookings[0]._id,
        amount: 100,
        type: 'seat_booking',
        status: 'completed',
        paymentMethod: 'card',
        paymentDetails: {
          transactionId: 'TXN001',
          paymentDate: new Date(),
          receiptNumber: 'RCP001'
        },
        createdBy: adminUser._id
      }
    ]);
    console.log('Created sample payments');

    // Create sample operations
    const operations = await Operation.insertMany([
      {
        type: 'maintenance',
        title: 'Regular Cleaning',
        description: 'Weekly cleaning of all seats',
        status: 'scheduled',
        priority: 'medium',
        startTime: new Date(),
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        assignedTo: regularUser._id,
        location: 'Main Hall',
        affectedSeats: [seats[0]._id, seats[1]._id],
        createdBy: adminUser._id
      }
    ]);
    console.log('Created sample operations');

    // Create sample reports
    const reports = await Report.insertMany([
      {
        type: 'attendance',
        title: 'Monthly Attendance Report',
        description: 'Attendance report for January 2024',
        parameters: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31')
        },
        status: 'completed',
        generatedBy: adminUser._id
      }
    ]);
    console.log('Created sample reports');

    console.log('Database initialization completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
};

// Run the initialization
initializeDatabase(); 