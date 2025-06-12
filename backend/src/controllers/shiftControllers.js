const { asyncHandler } = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Shift = require('../models/Shift');

// @desc    Get all shifts
// @route   GET /smlekha/shifts
// @access  Public
exports.getShifts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  const query = {};
  if (req.query.zone) query.zone = req.query.zone;
  if (req.query.date) {
    const date = new Date(req.query.date);
    query.date = {
      $gte: new Date(date.setHours(0, 0, 0, 0)),
      $lt: new Date(date.setHours(23, 59, 59, 999))
    };
  }

  const shifts = await Shift.find(query)
    .populate('staffAssigned', 'name email')
    .skip(startIndex)
    .limit(limit)
    .sort('-date');

  const total = await Shift.countDocuments(query);

  res.status(200).json({
    success: true,
    count: shifts.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    data: shifts
  });
});

// @desc    Get active shifts
// @route   GET /smlekha/shifts/active
// @access  Public
exports.getActiveShifts = asyncHandler(async (req, res) => {
  const shifts = await Shift.find({ isActive: true })
    .populate('staffAssigned', 'name email')
    .sort('-date');

  res.status(200).json({
    success: true,
    data: shifts
  });
});

// @desc    Get shift by ID
// @route   GET /smlekha/shifts/:id
// @access  Public
exports.getShiftById = asyncHandler(async (req, res) => {
  const shift = await Shift.findById(req.params.id)
    .populate('staffAssigned', 'name email');

  if (!shift) {
    throw new ApiError(404, 'Shift not found');
  }

  res.status(200).json({
    success: true,
    data: shift
  });
});

// @desc    Create new shift
// @route   POST /smlekha/shifts
// @access  Private/Admin
exports.createShift = asyncHandler(async (req, res) => {
  const shift = await Shift.create(req.body);

  res.status(201).json({
    success: true,
    data: shift
  });
});

// @desc    Update shift
// @route   PUT /smlekha/shifts/:id
// @access  Private/Admin
exports.updateShift = asyncHandler(async (req, res) => {
  const shift = await Shift.findById(req.params.id);

  if (!shift) {
    throw new ApiError(404, 'Shift not found');
  }

  const updatedShift = await Shift.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: updatedShift
  });
});

// @desc    Delete shift
// @route   DELETE /smlekha/shifts/:id
// @access  Private/Admin
exports.deleteShift = asyncHandler(async (req, res) => {
  const shift = await Shift.findById(req.params.id);

  if (!shift) {
    throw new ApiError(404, 'Shift not found');
  }

  await shift.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get shifts by zone
// @route   GET /smlekha/shifts/zone/:zoneId
// @access  Public
exports.getShiftsByZone = asyncHandler(async (req, res) => {
  const { zoneId } = req.params;
  const query = { zone: zoneId };

  if (req.query.date) {
    const date = new Date(req.query.date);
    query.date = {
      $gte: new Date(date.setHours(0, 0, 0, 0)),
      $lt: new Date(date.setHours(23, 59, 59, 999))
    };
  }

  const shifts = await Shift.find(query)
    .populate('staffAssigned', 'name email')
    .sort('-date');

  res.status(200).json({
    success: true,
    data: shifts
  });
});

// @desc    Get shift schedule
// @route   GET /smlekha/shifts/schedule
// @access  Public
exports.getShiftSchedule = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const query = {};

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const shifts = await Shift.find(query)
    .populate('staffAssigned', 'name email')
    .sort('date startTime');

  res.status(200).json({
    success: true,
    data: shifts
  });
});

// @desc    Get staff shifts
// @route   GET /smlekha/shifts/staff/:staffId
// @access  Public
exports.getStaffShifts = asyncHandler(async (req, res) => {
  const { staffId } = req.params;
  const query = { staffAssigned: staffId };

  if (req.query.startDate || req.query.endDate) {
    query.date = {};
    if (req.query.startDate) query.date.$gte = new Date(req.query.startDate);
    if (req.query.endDate) query.date.$lte = new Date(req.query.endDate);
  }

  const shifts = await Shift.find(query)
    .populate('staffAssigned', 'name email')
    .sort('-date');

  res.status(200).json({
    success: true,
    data: shifts
  });
});

// @desc    Get shift statistics
// @route   GET /smlekha/shifts/stats
// @access  Private/Admin
exports.getShiftStats = asyncHandler(async (req, res) => {
  const stats = await Shift.aggregate([
    {
      $group: {
        _id: '$zone',
        count: { $sum: 1 },
        activeCount: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
        },
        totalCapacity: { $sum: '$capacity' },
        totalOccupancy: { $sum: '$currentOccupancy' }
      }
    }
  ]);

  const totalShifts = await Shift.countDocuments();
  const activeShifts = await Shift.countDocuments({ isActive: true });

  res.status(200).json({
    success: true,
    data: {
      totalShifts,
      activeShifts,
      byZone: stats
    }
  });
}); 