const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused'],
    required: true
  },
  checkIn: {
    time: Date,
    location: {
      type: String,
      enum: ['main_entrance', 'back_entrance', 'other']
    }
  },
  checkOut: {
    time: Date,
    location: {
      type: String,
      enum: ['main_entrance', 'back_entrance', 'other']
    }
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  notes: String,
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  verificationMethod: {
    type: String,
    enum: ['manual', 'card_swipe', 'biometric', 'other'],
    default: 'manual'
  }
}, {
  timestamps: true
});

// Indexes
attendanceSchema.index({ student: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ status: 1 });

// Method to calculate duration
attendanceSchema.methods.calculateDuration = function() {
  if (this.checkIn && this.checkIn.time && this.checkOut && this.checkOut.time) {
    const duration = (this.checkOut.time - this.checkIn.time) / (1000 * 60); // Convert to minutes
    this.duration = Math.round(duration);
  }
  return this;
};

// Static method to get attendance statistics
attendanceSchema.statics.getStats = async function(studentId, startDate, endDate) {
  const stats = await this.aggregate([
    {
      $match: {
        student: mongoose.Types.ObjectId(studentId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  return stats.reduce((acc, curr) => {
    acc[curr._id] = curr.count;
    return acc;
  }, {});
};

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance; 