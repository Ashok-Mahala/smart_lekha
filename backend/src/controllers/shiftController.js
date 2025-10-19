const { asyncHandler } = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Shift = require('../models/Shift');

// @desc    Get shifts by property
// @route   GET /shifts?property=propertyId
// @access  Public or Protected
exports.getShifts = asyncHandler(async (req, res) => {
  const { property } = req.query;

  // If no property ID provided, return all shifts (or empty array)
  // You can modify this based on your requirements
  const query = property ? { property } : {};
  
  const shifts = await Shift.find(query).sort('startTime');

  res.status(200).json({
    success: true,
    data: shifts
  });
});

// @desc    Create new shift
// @route   POST /shifts
// @access  Private/Admin
exports.createShift = asyncHandler(async (req, res) => {
  const { name, startTime, endTime, property, fee } = req.body;
  
  if (!name || !startTime || !endTime || !property || !fee) {
    throw new ApiError(400, 'Please provide name, start time, end time, property, and fee');
  }

  const shift = await Shift.create({ 
    name, 
    startTime, 
    endTime,
    fee,
    property
  });
  
  res.status(201).json({
    success: true,
    data: shift
  });
});

// @desc    Update shift
// @route   PUT /shifts/:id
// @access  Private/Admin
exports.updateShift = asyncHandler(async (req, res) => {
  const { name, startTime, endTime, fee } = req.body;
  
  const shift = await Shift.findById(req.params.id);
  if (!shift) {
    throw new ApiError(404, 'Shift not found');
  }

  const updatedShift = await Shift.findByIdAndUpdate(
    req.params.id,
    { name, startTime, endTime, fee },
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
// @route   DELETE /shifts/:id
// @access  Private/Admin
exports.deleteShift = asyncHandler(async (req, res) => {
  const shift = await Shift.findById(req.params.id);
  if (!shift) {
    throw new ApiError(404, 'Shift not found');
  }

  await Shift.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {}
  });
});