const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'attendance',
      'financial',
      'occupancy',
      'student',
      'booking',
      'payment',
      'custom'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  parameters: {
    startDate: Date,
    endDate: Date,
    filters: mongoose.Schema.Types.Mixed,
    groupBy: [String],
    sortBy: String,
    sortOrder: {
      type: String,
      enum: ['asc', 'desc'],
      default: 'asc'
    }
  },
  data: mongoose.Schema.Types.Mixed,
  format: {
    type: String,
    enum: ['pdf', 'excel', 'csv', 'json'],
    default: 'pdf'
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  fileUrl: String,
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  error: String,
  metadata: {
    rowCount: Number,
    generationTime: Number,
    fileSize: Number
  }
}, {
  timestamps: true
});

// Indexes
reportSchema.index({ type: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ generatedBy: 1 });
reportSchema.index({ createdAt: 1 });

// Method to update report status
reportSchema.methods.updateStatus = async function(status, error = null) {
  this.status = status;
  if (error) {
    this.error = error;
  }
  return this.save();
};

// Method to set report data
reportSchema.methods.setData = async function(data, metadata = {}) {
  this.data = data;
  this.metadata = {
    ...this.metadata,
    ...metadata
  };
  this.status = 'completed';
  return this.save();
};

// Static method to get report statistics
reportSchema.statics.getStats = async function(startDate, endDate) {
  const stats = await this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        avgGenerationTime: { $avg: '$metadata.generationTime' }
      }
    }
  ]);

  return stats.reduce((acc, curr) => {
    acc[curr._id] = {
      count: curr.count,
      avgGenerationTime: Math.round(curr.avgGenerationTime)
    };
    return acc;
  }, {});
};

const Report = mongoose.model('Report', reportSchema);

module.exports = Report; 