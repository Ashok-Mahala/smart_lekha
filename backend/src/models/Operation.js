const mongoose = require('mongoose');

const operationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'maintenance',
      'cleaning',
      'inspection',
      'repair',
      'upgrade',
      'other'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    type: String,
    required: true
  },
  affectedSeats: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seat'
  }],
  resources: [{
    name: String,
    quantity: Number,
    unit: String
  }],
  cost: {
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completionNotes: String,
  attachments: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: Date
  }]
}, {
  timestamps: true
});

// Indexes
operationSchema.index({ type: 1 });
operationSchema.index({ status: 1 });
operationSchema.index({ priority: 1 });
operationSchema.index({ startTime: 1, endTime: 1 });
operationSchema.index({ assignedTo: 1 });

// Method to check if operation is overdue
operationSchema.methods.isOverdue = function() {
  return this.status === 'scheduled' && new Date() > this.endTime;
};

// Method to complete operation
operationSchema.methods.complete = async function(userId, notes) {
  if (this.status === 'completed') {
    throw new Error('Operation is already completed');
  }

  this.status = 'completed';
  this.completedBy = userId;
  this.completionNotes = notes;
  return this.save();
};

// Static method to get operation statistics
operationSchema.statics.getStats = async function(startDate, endDate) {
  const stats = await this.aggregate([
    {
      $match: {
        startTime: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalCost: { $sum: '$cost.amount' },
        avgDuration: {
          $avg: {
            $subtract: ['$endTime', '$startTime']
          }
        }
      }
    }
  ]);

  return stats.reduce((acc, curr) => {
    acc[curr._id] = {
      count: curr.count,
      totalCost: curr.totalCost,
      avgDuration: Math.round(curr.avgDuration / (1000 * 60 * 60)) // Convert to hours
    };
    return acc;
  }, {});
};

const Operation = mongoose.model('Operation', operationSchema);

module.exports = Operation; 