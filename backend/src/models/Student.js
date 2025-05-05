const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  course: {
    type: String,
    required: true
  },
  batch: {
    type: String,
    required: true
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  documents: [{
    type: {
      type: String,
      enum: ['id', 'certificate', 'other']
    },
    url: String,
    uploadedAt: Date
  }],
  notes: String
}, {
  timestamps: true
});

// Indexes
studentSchema.index({ studentId: 1 });
studentSchema.index({ email: 1 });
studentSchema.index({ status: 1 });
studentSchema.index({ course: 1, batch: 1 });

// Virtual for full name
studentSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Method to get public profile
studentSchema.methods.getPublicProfile = function() {
  const student = this.toObject();
  delete student.__v;
  return student;
};

const Student = mongoose.model('Student', studentSchema);

module.exports = Student; 