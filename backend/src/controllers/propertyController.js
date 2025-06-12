const { asyncHandler } = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Property = require('../models/Property');

// @desc    Get all properties
// @route   GET /smlekha/properties
// @access  Private
exports.getProperties = asyncHandler(async (req, res) => {
  const properties = await Property.find({ user: req.user._id });
  res.status(200).json(properties);
});

// @desc    Get single property
// @route   GET /smlekha/properties/:id
// @access  Private
exports.getPropertyById = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) {
    throw new ApiError(404, 'Property not found');
  }
  res.status(200).json(property);
});

// @desc    Create new property
// @route   POST /smlekha/properties
// @access  Private
exports.createProperty = asyncHandler(async (req, res) => {
  const propertyData = {
    ...req.body,
    user: req.user._id // This comes from your auth middleware
  };
  const property = await Property.create(propertyData);
  res.status(201).json(property);
});

// @desc    Update property
// @route   PUT /smlekha/properties/:id
// @access  Private
exports.updateProperty = asyncHandler(async (req, res) => {
  const property = await Property.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!property) {
    throw new ApiError(404, 'Property not found');
  }
  res.status(200).json(property);
});

// @desc    Delete property
// @route   DELETE /smlekha/properties/:id
// @access  Private/Admin
exports.deleteProperty = asyncHandler(async (req, res) => {
  const property = await Property.findByIdAndDelete(req.params.id);
  if (!property) {
    throw new ApiError(404, 'Property not found');
  }
  res.status(200).json({ success: true });
}); 