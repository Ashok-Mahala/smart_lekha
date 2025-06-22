const Seat = require('../models/Seat');
const Student = require('../models/Student');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { ApiError } = require('../utils/ApiError');
const { asyncHandler } = require('../utils/asyncHandler');
const mongoose = require('mongoose');

// Get all seats for a property
const getSeatsByProperty = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  const { status, type } = req.query;
  
  const query = { propertyId };
  if (status) query.status = status;
  if (type) query.type = type;

  try {
    // 1. Get all seats with basic student info
    const seats = await Seat.find(query)
      .sort({ row: 1, column: 1 })
      .populate({
        path: 'currentStudent',
        select: 'firstName lastName email phone studentId'
      })
      .populate({
        path: 'lastAssigned.student',
        select: 'firstName lastName email'
      });

    // 2. Get all bookings for occupied seats in one query
    const occupiedSeatIds = seats
      .filter(seat => seat.status === 'occupied' && seat.currentStudent)
      .map(seat => seat._id);

    const bookings = await Booking.find({
      seat: { $in: occupiedSeatIds },
      status: { $ne: 'cancelled' }
    })
    .populate('shift', 'name startTime endTime')
    .sort({ createdAt: -1 });

    // Group bookings by seat ID
    const bookingsBySeat = {};
    bookings.forEach(booking => {
      if (!bookingsBySeat[booking.seat]) {
        bookingsBySeat[booking.seat] = booking;
      }
    });

    // 3. Combine the data
    const enhancedSeats = seats.map(seat => {
      const seatObj = seat.toObject();
      
      if (seat.status === 'occupied' && seat.currentStudent) {
        const booking = bookingsBySeat[seat._id.toString()];
        if (booking) {
          seatObj.booking = booking.toObject();
          seatObj.bookingDate = booking.startDate || seat.updatedAt;
        }
        
        // Format student name properly
        if (seat.currentStudent) {
          seatObj.currentStudent.fullName = [
            seat.currentStudent.firstName,
            seat.currentStudent.lastName
          ].filter(Boolean).join(' ');
        }
      }
      
      return seatObj;
    });

    res.json(enhancedSeats);
  } catch (error) {
    console.error('Error fetching seats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch seat data',
      message: error.message 
    });
  }
});

// Create multiple seats
const bulkCreateSeats = asyncHandler(async (req, res) => {
  const { seats } = req.body;
  
  if (!Array.isArray(seats) || seats.length === 0) {
    throw new ApiError(400, 'Seats data is required');
  }

  // Validate each seat has required fields
  const validatedSeats = seats.map(seat => ({
    ...seat,
    status: seat.status || 'available',
    type: seat.type || 'standard'
  }));

  const createdSeats = await Seat.insertMany(validatedSeats);
  res.status(201).json(createdSeats);
});

// Book a seat
const bookSeat = async (req, res) => {
  try {
    const { seatId } = req.params;
    const formData = req.body;
    const files = req.files;

    // 1. Verify seat availability
    const seat = await Seat.findById(seatId);
    if (!seat) return res.status(404).json({ error: 'Seat not found' });
    if (!seat.isAvailable()) return res.status(400).json({ error: `Seat is ${seat.status}` });

    // 2. Parse student data
    const studentData = JSON.parse(formData.studentData);
    if (!studentData.email) return res.status(400).json({ error: 'Email is required' });

    // 3. Find or create student
    let student = await Student.findOne({ email: studentData.email });
    if (!student) {
      student = new Student({
        firstName: studentData.firstName,
        lastName: studentData.lastName || '',
        email: studentData.email,
        phone: studentData.phone,
        currentSeat: seatId,
        institution: studentData.institution || '',
        course: studentData.course || '',
        aadharNumber: studentData.aadharNumber || '',
        status: 'active'
      });
      await student.save();
    }

    // 4. Create booking first (since payment needs booking reference)
    const booking = new Booking({
      seat: seatId,
      student: student._id,
      shift: formData.shiftId,
      startDate: new Date(formData.startDate),
      feeDetails: {
        amount: parseFloat(formData.fee || 0),
        collected: parseFloat(formData.collectedFee || 0),
        balance: parseFloat(formData.fee || 0) - parseFloat(formData.collectedFee || 0)
      },
      createdBy: req.user?._id || student._id // Fallback to student if no user
    });
    await booking.save();

    // 5. Create payment with required fields
    const paymentData = JSON.parse(formData.paymentData);
    const payment = new Payment({
      amount: parseFloat(paymentData.amount),
      paymentMethod: paymentData.method || 'cash',
      status: 'completed',
      student: student._id,
      booking: booking._id, // Required field
      createdBy: req.user?._id || student._id // Required field
    });
    await payment.save();

    // 6. Handle file uploads
    const documents = [];
    if (files.profilePhoto) {
      documents.push({
        type: 'profile_photo',
        url: `/uploads/${files.profilePhoto[0].filename}`,
        originalName: files.profilePhoto[0].originalname
      });
    }
    if (files.identityProof) {
      documents.push({
        type: 'identity_proof',
        url: `/uploads/${files.identityProof[0].filename}`,
        originalName: files.identityProof[0].originalname
      });
    }

    // 7. Update booking with documents
    booking.documents = documents;
    await booking.save();

    // 8. Update seat status
    seat.status = 'occupied';
    seat.currentStudent = student._id;
    await seat.save();

    res.status(201).json({
      success: true,
      data: { booking, payment }
    });

  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Booking failed',
      message: error.message
    });
  }
};
// Reserve a seat
const reserveSeat = asyncHandler(async (req, res) => {
  const { studentId, until } = req.body;
  const seat = await Seat.findById(req.params.id);

  if (!seat) {
    throw new ApiError(404, 'Seat not found');
  }

  if (seat.status !== 'available') {
    throw new ApiError(400, 'Seat is not available for reservation');
  }

  seat.status = 'reserved';
  seat.currentStudent = studentId;
  seat.reservedUntil = new Date(until);

  await seat.save();
  res.json(seat);
});

// Release a seat
const releaseSeat = asyncHandler(async (req, res) => {
  const seat = await Seat.findById(req.params.id);

  if (!seat) {
    throw new ApiError(404, 'Seat not found');
  }

  seat.currentStudent = null;
  seat.status = 'available';
  seat.reservedUntil = null;

  await seat.save();
  res.json(seat);
});

// Get seat statistics for a property
const getSeatStats = asyncHandler(async (req, res) => {
  const { propertyId } = req.query;
  
  if (!propertyId) {
    throw new ApiError(400, 'Property ID is required');
  }

  const stats = await Seat.aggregate([
    { $match: { propertyId: new mongoose.Types.ObjectId(propertyId) } },
    { $group: { 
      _id: '$status', 
      count: { $sum: 1 },
      types: { $push: '$type' }
    }},
    { $project: {
      status: '$_id',
      count: 1,
      types: 1,
      _id: 0
    }}
  ]);

  const total = await Seat.countDocuments({ propertyId });
  
  res.json({
    total,
    stats,
    propertyId
  });
});

// Get available shifts
const getShifts = asyncHandler(async (req, res) => {
  // In a real app, this would come from a configuration
  const shifts = [
    { id: 'morning', name: 'Morning', time: '8:00 AM - 12:00 PM' },
    { id: 'afternoon', name: 'Afternoon', time: '1:00 PM - 5:00 PM' },
    { id: 'evening', name: 'Evening', time: '6:00 PM - 10:00 PM' }
  ];
  
  res.json(shifts);
});

// Update seat status
const updateSeatStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const seat = await Seat.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );

  if (!seat) {
    throw new ApiError(404, 'Seat not found');
  }

  res.json(seat);
});

// Delete a seat by ID
const deleteSeat = asyncHandler(async (req, res) => {
  const seat = await Seat.findByIdAndDelete(req.params.id);

  if (!seat) {
    throw new ApiError(404, 'Seat not found');
  }

  res.json({ message: 'Seat deleted successfully', seatId: req.params.id });
});

const bulkUpdateSeats = async (req, res) => {
  try {
    console.log('Received bulk update request:', req.body);
    
    // 1. Validate input is an array
    if (!Array.isArray(req.body)) {
      return res.status(400).json({ 
        error: "Invalid request format",
        details: "Expected an array of updates" 
      });
    }

    // 2. Process each update
    const bulkOps = req.body.map(update => {
      if (!update.id || !update.updates) {
        throw new Error(`Invalid update format: ${JSON.stringify(update)}`);
      }
      
      return {
        updateOne: {
          filter: { _id: update.id },
          update: { $set: update.updates }
        }
      };
    });

    // 3. Execute bulk operation
    const result = await Seat.bulkWrite(bulkOps);
    
    res.json({
      success: true,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Bulk update failed:', error);
    res.status(400).json({
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// To delete bulk seats
const bulkDeleteSeats = async (req, res) => {
  try {
    const seatIds = req.body;
    const result = await Seat.deleteMany({ _id: { $in: seatIds } });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


module.exports = {
  getSeatsByProperty,
  bulkCreateSeats,
  bookSeat,
  reserveSeat,
  releaseSeat,
  getSeatStats,
  getShifts,
  updateSeatStatus,
  deleteSeat,
  bulkUpdateSeats,
  bulkDeleteSeats
};