const Seat = require('../models/Seat');
const { ApiError } = require('../utils/ApiError');
const { asyncHandler } = require('../utils/asyncHandler');

// Get all seats with pagination and filters
const getSeats = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, type, features } = req.query;
  const query = {};

  if (status) query.status = status;
  if (type) query.type = type;
  if (features) {
    query.features = { $all: features.split(',') };
  }

  const seats = await Seat.find(query)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ seatNumber: 1 });

  const count = await Seat.countDocuments(query);

  res.json({
    seats,
    totalPages: Math.ceil(count / limit),
    currentPage: page
  });
});

// Get seat by ID
const getSeatById = asyncHandler(async (req, res) => {
  const seat = await Seat.findById(req.params.id);
  if (!seat) {
    throw new ApiError(404, 'Seat not found');
  }
  res.json(seat);
});

// Create new seat
const createSeat = asyncHandler(async (req, res) => {
  const seat = new Seat(req.body);
  await seat.save();
  res.status(201).json(seat);
});

// Update seat
const updateSeat = asyncHandler(async (req, res) => {
  const seat = await Seat.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  if (!seat) {
    throw new ApiError(404, 'Seat not found');
  }
  res.json(seat);
});

// Delete seat
const deleteSeat = asyncHandler(async (req, res) => {
  const seat = await Seat.findByIdAndDelete(req.params.id);
  if (!seat) {
    throw new ApiError(404, 'Seat not found');
  }
  res.json({ message: 'Seat deleted successfully' });
});

// Get seat availability
const getSeatAvailability = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const queryDate = date ? new Date(date) : new Date();

  const seats = await Seat.find({ status: 'available' });
  res.json(seats);
});

// Assign student to seat
const assignStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.body;
  const seat = await Seat.findById(req.params.id);
  
  if (!seat) {
    throw new ApiError(404, 'Seat not found');
  }

  if (!seat.isAvailable()) {
    throw new ApiError(400, 'Seat is not available');
  }

  await seat.assignStudent(studentId);
  res.json(seat);
});

// Release seat
const releaseSeat = asyncHandler(async (req, res) => {
  const seat = await Seat.findById(req.params.id);
  
  if (!seat) {
    throw new ApiError(404, 'Seat not found');
  }

  await seat.release();
  res.json(seat);
});

// Get seat statistics
const getSeatStats = asyncHandler(async (req, res) => {
  const stats = await Seat.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  res.json(stats);
});

module.exports = {
  getSeats,
  getSeatById,
  createSeat,
  updateSeat,
  deleteSeat,
  getSeatAvailability,
  assignStudent,
  releaseSeat,
  getSeatStats
}; 