const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SystemSettingsSchema = new Schema({
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  maintenanceMessage: {
    type: String,
    default: 'System is under maintenance. Please try again later.'
  },
  bookingSettings: {
    maxBookingDuration: {
      type: Number,
      default: 4 // hours
    },
    minBookingDuration: {
      type: Number,
      default: 1 // hour
    },
    maxAdvanceBookingDays: {
      type: Number,
      default: 7
    },
    allowMultipleBookings: {
      type: Boolean,
      default: false
    },
    cancellationPolicy: {
      allowed: {
        type: Boolean,
        default: true
      },
      gracePeriod: {
        type: Number,
        default: 30 // minutes
      },
      penalty: {
        type: Number,
        default: 0 // percentage
      }
    }
  },
  notificationSettings: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    smsNotifications: {
      type: Boolean,
      default: false
    },
    notificationTypes: [{
      type: String,
      enum: ['booking', 'payment', 'cancellation', 'system']
    }]
  },
  paymentSettings: {
    currency: {
      type: String,
      default: 'USD'
    },
    paymentMethods: [{
      type: String,
      enum: ['credit_card', 'debit_card', 'bank_transfer', 'cash']
    }],
    taxRate: {
      type: Number,
      default: 0
    },
    lateFee: {
      type: Number,
      default: 0
    }
  },
  securitySettings: {
    sessionTimeout: {
      type: Number,
      default: 30 // minutes
    },
    maxLoginAttempts: {
      type: Number,
      default: 5
    },
    passwordPolicy: {
      minLength: {
        type: Number,
        default: 8
      },
      requireSpecialChar: {
        type: Boolean,
        default: true
      },
      requireNumbers: {
        type: Boolean,
        default: true
      }
    }
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastBackup: {
    type: Date
  },
  backupFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily'
  }
}, {
  timestamps: true
});

// Indexes
SystemSettingsSchema.index({ maintenanceMode: 1 });
SystemSettingsSchema.index({ 'bookingSettings.maxAdvanceBookingDays': 1 });

// Methods
SystemSettingsSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('SystemSettings', SystemSettingsSchema); 