const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/user.model');
const Financial = require('../models/financial.model');
const System = require('../models/system.model');
const Operation = require('../models/operation.model');
const Report = require('../models/report.model');

async function initDatabase() {
  try {
    console.log('🚀 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://admin:admin123@localhost:27017/seatflow?authSource=admin');
    console.log('✅ Connected to MongoDB');

    // Create collections if they don't exist
    console.log('📦 Creating collections...');
    await Promise.all([
      User.createCollection(),
      Financial.createCollection(),
      System.createCollection(),
      Operation.createCollection(),
      Report.createCollection()
    ]);
    console.log('✅ Collections created');

    // Create indexes
    console.log('🔑 Creating indexes...');
    await Promise.all([
      // User indexes
      User.collection.createIndex({ email: 1 }, { unique: true }),
      User.collection.createIndex({ role: 1 }),

      // Financial indexes
      Financial.collection.createIndex({ studentId: 1 }),
      Financial.collection.createIndex({ bookingId: 1 }),
      Financial.collection.createIndex({ status: 1 }),
      Financial.collection.createIndex({ createdAt: 1 }),

      // System indexes
      System.collection.createIndex({ key: 1 }, { unique: true }),

      // Operation indexes
      Operation.collection.createIndex({ type: 1 }),
      Operation.collection.createIndex({ status: 1 }),
      Operation.collection.createIndex({ assignedTo: 1 }),
      Operation.collection.createIndex({ startTime: 1 }),
      Operation.collection.createIndex({ endTime: 1 }),

      // Report indexes
      Report.collection.createIndex({ type: 1 }),
      Report.collection.createIndex({ status: 1 }),
      Report.collection.createIndex({ 'period.start': 1 }),
      Report.collection.createIndex({ 'period.end': 1 }),
      Report.collection.createIndex({ generatedBy: 1 })
    ]);
    console.log('✅ Indexes created');

    // Create default admin user if not exists
    console.log('👤 Creating default admin user...');
    const adminExists = await User.findOne({ email: 'admin@seatflow.com' });
    if (!adminExists) {
      await User.create({
        name: 'Admin',
        email: 'admin@seatflow.com',
        password: 'admin123', // Change this in production
        role: 'admin'
      });
      console.log('✅ Default admin user created');
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    // Create default system settings if not exists
    console.log('⚙️ Creating default system settings...');
    const settingsExist = await System.findOne({ key: 'settings' });
    if (!settingsExist) {
      await System.create({
        key: 'settings',
        value: {
          maintenanceMode: false,
          maintenanceMessage: '',
          bookingSettings: {
            maxBookingDuration: 4,
            minBookingDuration: 1,
            maxAdvanceBookingDays: 30,
            allowMultipleBookings: true,
            cancellationPolicy: {
              allowed: true,
              gracePeriod: 24,
              penalty: 10
            }
          },
          notificationSettings: {
            emailNotifications: true,
            smsNotifications: false,
            notificationTypes: ['booking', 'payment', 'system']
          },
          paymentSettings: {
            currency: 'USD',
            paymentMethods: ['credit_card', 'bank_transfer'],
            taxRate: 0,
            lateFee: 0
          },
          securitySettings: {
            sessionTimeout: 30,
            maxLoginAttempts: 5,
            passwordPolicy: {
              minLength: 8,
              requireSpecialChar: true,
              requireNumbers: true
            }
          }
        }
      });
      console.log('✅ Default system settings created');
    } else {
      console.log('ℹ️ System settings already exist');
    }

    console.log('✨ Database initialization completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase(); 