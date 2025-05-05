const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OperationSchema = new Schema({
  type: {
    type: String,
    enum: ['shift', 'maintenance', 'alert', 'log'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number // in minutes
  },
  location: {
    type: String
  },
  notes: {
    type: String
  },
  metadata: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes
OperationSchema.index({ type: 1 });
OperationSchema.index({ status: 1 });
OperationSchema.index({ priority: 1 });
OperationSchema.index({ assignedTo: 1 });
OperationSchema.index({ startTime: 1 });

// Virtual for duration calculation
OperationSchema.virtual('calculatedDuration').get(function() {
  if (this.endTime && this.startTime) {
    return Math.round((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60));
  }
  return null;
});

// Pre-save middleware to calculate duration
OperationSchema.pre('save', function(next) {
  if (this.endTime && this.startTime) {
    this.duration = this.calculatedDuration;
  }
  next();
});

// Methods
OperationSchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.duration = this.calculatedDuration;
  return obj;
};

module.exports = mongoose.model('Operation', OperationSchema); 