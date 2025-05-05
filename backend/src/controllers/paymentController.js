const { asyncHandler } = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Payment = require('../models/Payment');
const Student = require('../models/Student');

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
exports.getPayments = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  const query = {};
  if (req.query.student) query.student = req.query.student;
  if (req.query.status) query.status = req.query.status;
  if (req.query.type) query.type = req.query.type;
  if (req.query.startDate || req.query.endDate) {
    query.date = {};
    if (req.query.startDate) query.date.$gte = new Date(req.query.startDate);
    if (req.query.endDate) query.date.$lte = new Date(req.query.endDate);
  }

  const payments = await Payment.find(query)
    .populate('student', 'name studentId')
    .skip(startIndex)
    .limit(limit)
    .sort('-date');

  const total = await Payment.countDocuments(query);

  res.status(200).json({
    success: true,
    count: payments.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    data: payments
  });
});

// @desc    Get single payment
// @route   GET /api/payments/:id
// @access  Private
exports.getPaymentById = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate('student', 'name studentId');

  if (!payment) {
    throw new ApiError(404, 'Payment not found');
  }

  res.status(200).json({
    success: true,
    data: payment
  });
});

// @desc    Create payment
// @route   POST /api/payments
// @access  Private
exports.createPayment = asyncHandler(async (req, res) => {
  const { student, amount, type, description, paymentMethod } = req.body;

  // Check if student exists
  const studentExists = await Student.findById(student);
  if (!studentExists) {
    throw new ApiError(404, 'Student not found');
  }

  const payment = await Payment.create({
    student,
    amount,
    type,
    description,
    paymentMethod,
    status: 'pending',
    createdBy: req.user.id
  });

  res.status(201).json({
    success: true,
    data: payment
  });
});

// @desc    Update payment
// @route   PUT /api/payments/:id
// @access  Private
exports.updatePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    throw new ApiError(404, 'Payment not found');
  }

  // Check if payment can be updated
  if (payment.status === 'completed' || payment.status === 'cancelled') {
    throw new ApiError(400, 'Cannot update a completed or cancelled payment');
  }

  const updatedPayment = await Payment.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: updatedPayment
  });
});

// @desc    Delete payment
// @route   DELETE /api/payments/:id
// @access  Private/Admin
exports.deletePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    throw new ApiError(404, 'Payment not found');
  }

  await payment.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Complete payment
// @route   PUT /api/payments/:id/complete
// @access  Private
exports.completePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    throw new ApiError(404, 'Payment not found');
  }

  if (payment.status !== 'pending') {
    throw new ApiError(400, 'Only pending payments can be completed');
  }

  payment.status = 'completed';
  payment.completedBy = req.user.id;
  payment.completionNotes = req.body.notes;
  payment.completedAt = new Date();
  await payment.save();

  res.status(200).json({
    success: true,
    data: payment
  });
});

// @desc    Cancel payment
// @route   PUT /api/payments/:id/cancel
// @access  Private
exports.cancelPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    throw new ApiError(404, 'Payment not found');
  }

  if (payment.status !== 'pending') {
    throw new ApiError(400, 'Only pending payments can be cancelled');
  }

  payment.status = 'cancelled';
  payment.cancelledBy = req.user.id;
  payment.cancellationReason = req.body.reason;
  payment.cancelledAt = new Date();
  await payment.save();

  res.status(200).json({
    success: true,
    data: payment
  });
});

// @desc    Get payment statistics
// @route   GET /api/payments/stats
// @access  Private/Admin
exports.getPaymentStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const query = {};

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const stats = await Payment.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);

  const totalPayments = await Payment.countDocuments(query);
  const totalAmount = await Payment.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      stats,
      totalPayments,
      totalAmount: totalAmount[0]?.total || 0
    }
  });
});

// @desc    Get student payment history
// @route   GET /api/payments/student/:studentId
// @access  Private
exports.getStudentPayments = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { startDate, endDate } = req.query;

  const query = { student: studentId };
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const payments = await Payment.find(query)
    .sort('-date');

  const stats = await Payment.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      payments,
      stats
    }
  });
}); 