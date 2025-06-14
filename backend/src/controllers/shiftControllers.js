const { asyncHandler } = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Shift = require('../models/Shift');

// @desc    Get all shifts
// @route   GET /shifts
// @access  Public
exports.getShifts = asyncHandler(async (req, res) => {
  const shifts = await Shift.find().sort('startTime');
  res.status(200).json({
    success: true,
    data: shifts
  });
});

// @desc    Create new shift
// @route   POST /shifts
// @access  Private/Admin
exports.createShift = asyncHandler(async (req, res) => {
  const { name, startTime, endTime, property } = req.body;
  
  if (!name || !startTime || !endTime || !property) {
    throw new ApiError(400, 'Please provide name, start time, end time');
  }

  const shift = await Shift.create({ 
    name, 
    startTime, 
    endTime,
    property // Automatically included from localStorage
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
  const { name, startTime, endTime } = req.body;
  
  const shift = await Shift.findById(req.params.id);
  if (!shift) {
    throw new ApiError(404, 'Shift not found');
  }

  const updatedShift = await Shift.findByIdAndUpdate(
    req.params.id,
    { name, startTime, endTime },
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

  await Shift.findByIdAndDelete(req.params.id); // use model-level deletion

  res.status(200).json({
    success: true,
    data: {}
  });
});
