const Seat = require('../models/Seat');
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

  const seats = await Seat.find(query)
    .sort({ row: 1, column: 1 })
    .populate('currentStudent', 'name email studentId')
    .populate('lastAssigned.student', 'name email studentId');

  res.json(seats);
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
const bookSeat = asyncHandler(async (req, res) => {
  const { studentId, until } = req.body;
  const seat = await Seat.findById(req.params.id);

  if (!seat) {
    throw new ApiError(404, 'Seat not found');
  }

  if (!seat.isAvailable()) {
    throw new ApiError(400, 'Seat is not available for booking');
  }

  seat.currentStudent = studentId;
  seat.status = 'occupied';
  if (until) {
    seat.reservedUntil = new Date(until);
  }

  await seat.save();
  res.json(seat);
});

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

module.exports = {
  getSeatsByProperty,
  bulkCreateSeats,
  bookSeat,
  reserveSeat,
  releaseSeat,
  getSeatStats,
  getShifts,
  updateSeatStatus
};