const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[0-9]{10,15}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  currentSeat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seat',
    default: null
  },
  institution: {
    type: String,
    trim: true
  },
  course: {
    type: String,
    trim: true
  },
    course: {
    type: String,
    trim: true
  },
  aadharNumber: {
    type: Number,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[0-9]{12}$/.test(v);
      },
      message: props => `${props.value} is not a valid Aadhar number!`
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Virtual for full name
studentSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Indexes
studentSchema.index({ email: 1 }, { unique: true });
studentSchema.index({ currentSeat: 1 });
studentSchema.index({ status: 1 });

// Middleware to clear seat assignment when student is deleted or deactivated
studentSchema.pre('save', async function(next) {
  if (this.isModified('status') && this.status === 'inactive' && this.currentSeat) {
    const Seat = mongoose.model('Seat');
    await Seat.findByIdAndUpdate(this.currentSeat, { 
      $set: { currentStudent: null, status: 'available' }
    });
    this.currentSeat = null;
  }
  next();
});

// Static method to find active students
studentSchema.statics.findActive = function() {
  return this.find({ status: 'active' });
};

// Method to assign seat to student
studentSchema.methods.assignSeat = async function(seatId) {
  const Seat = mongoose.model('Seat');
  const seat = await Seat.findById(seatId);
  
  if (!seat) throw new Error('Seat not found');
  if (!seat.isAvailable()) throw new Error('Seat is not available');
  
  // Release current seat if exists
  if (this.currentSeat) {
    await Seat.findByIdAndUpdate(this.currentSeat, {
      currentStudent: null,
      status: 'available'
    });
  }
  
  // Assign new seat
  this.currentSeat = seatId;
  await this.save();
  
  // Update seat
  seat.currentStudent = this._id;
  seat.status = 'occupied';
  await seat.save();
  
  return this;
};

module.exports = mongoose.model('Student', studentSchema);