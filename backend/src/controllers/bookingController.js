const { asyncHandler } = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Booking = require('../models/Booking');
const Seat = require('../models/Seat');
const Student = require('../models/Student');

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private
exports.getBookings = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  const query = {};
  if (req.query.status) query.status = req.query.status;
  if (req.query.student) query.student = req.query.student;
  if (req.query.seat) query.seat = req.query.seat;

  const bookings = await Booking.find(query)
    .populate('student', 'name studentId')
    .populate('seat', 'seatNumber row column')
    .skip(startIndex)
    .limit(limit)
    .sort('-createdAt');

  const total = await Booking.countDocuments(query);

  res.status(200).json({
    success: true,
    count: bookings.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    data: bookings
  });
});

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
exports.getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('student', 'name studentId')
    .populate('seat', 'seatNumber row column');

  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  res.status(200).json({
    success: true,
    data: booking
  });
});

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
exports.createBooking = asyncHandler(async (req, res) => {
  const { student, seat, startDate, endDate, purpose } = req.body;

  // Check if seat is available
  const seatExists = await Seat.findById(seat);
  if (!seatExists) {
    throw new ApiError(404, 'Seat not found');
  }

  if (seatExists.status !== 'available') {
    throw new ApiError(400, 'Seat is not available');
  }

  // Check if student exists
  const studentExists = await Student.findById(student);
  if (!studentExists) {
    throw new ApiError(404, 'Student not found');
  }

  // Check for overlapping bookings
  const overlappingBooking = await Booking.findOne({
    seat,
    status: 'active',
    $or: [
      {
        startDate: { $lte: endDate },
        endDate: { $gte: startDate }
      }
    ]
  });

  if (overlappingBooking) {
    throw new ApiError(400, 'Seat is already booked for the selected period');
  }

  const booking = await Booking.create({
    student,
    seat,
    startDate,
    endDate,
    purpose,
    createdBy: req.user.id
  });

  // Update seat status
  seatExists.status = 'occupied';
  await seatExists.save();

  res.status(201).json({
    success: true,
    data: booking
  });
});

// @desc    Update booking
// @route   PUT /api/bookings/:id
// @access  Private
exports.updateBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  // Check if booking can be updated
  if (booking.status === 'cancelled' || booking.status === 'completed') {
    throw new ApiError(400, 'Cannot update a cancelled or completed booking');
  }

  const updatedBooking = await Booking.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: updatedBooking
  });
});

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private/Admin
exports.deleteBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  // Update seat status if booking was active
  if (booking.status === 'active') {
    const seat = await Seat.findById(booking.seat);
    if (seat) {
      seat.status = 'available';
      await seat.save();
    }
  }

  await booking.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
exports.cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  if (booking.status !== 'active') {
    throw new ApiError(400, 'Only active bookings can be cancelled');
  }

  booking.status = 'cancelled';
  booking.cancelledBy = req.user.id;
  booking.cancellationReason = req.body.reason;
  await booking.save();

  // Update seat status
  const seat = await Seat.findById(booking.seat);
  if (seat) {
    seat.status = 'available';
    await seat.save();
  }

  res.status(200).json({
    success: true,
    data: booking
  });
});

// @desc    Complete booking
// @route   PUT /api/bookings/:id/complete
// @access  Private
exports.completeBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  if (booking.status !== 'active') {
    throw new ApiError(400, 'Only active bookings can be completed');
  }

  booking.status = 'completed';
  booking.completedBy = req.user.id;
  booking.completionNotes = req.body.notes;
  await booking.save();

  // Update seat status
  const seat = await Seat.findById(booking.seat);
  if (seat) {
    seat.status = 'available';
    await seat.save();
  }

  res.status(200).json({
    success: true,
    data: booking
  });
});

// @desc    Get booking statistics
// @route   GET /api/bookings/stats
// @access  Private/Admin
exports.getBookingStats = asyncHandler(async (req, res) => {
  const stats = await Booking.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalDuration: {
          $sum: {
            $divide: [
              { $subtract: ['$endDate', '$startDate'] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      }
    }
  ]);

  const totalBookings = await Booking.countDocuments();
  const activeBookings = await Booking.countDocuments({ status: 'active' });
  const completedBookings = await Booking.countDocuments({ status: 'completed' });
  const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });

  res.status(200).json({
    success: true,
    data: {
      stats,
      totalBookings,
      activeBookings,
      completedBookings,
      cancelledBookings
    }
  });
}); 