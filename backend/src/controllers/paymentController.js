const { asyncHandler } = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const Seat = require('../models/Seat');

// @desc    Get all payments
// @route   GET /smlekha/payments
// @access  Private
exports.getPayments = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  const query = {};
  if (req.query.student) query.student = req.query.student;
  if (req.query.status) query.status = req.query.status;
  if (req.query.shift) query.shift = req.query.shift;
  if (req.query.startDate || req.query.endDate) {
    query.paymentDate = {};
    if (req.query.startDate) query.paymentDate.$gte = new Date(req.query.startDate);
    if (req.query.endDate) query.paymentDate.$lte = new Date(req.query.endDate);
  }

  const payments = await Payment.find(query)
    .populate('student', 'firstName lastName email phone')
    .populate('seat', 'seatNumber')
    .populate('shift', 'name')
    .skip(startIndex)
    .limit(limit)
    .sort('-paymentDate');

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
// @route   GET /smlekha/payments/:id
// @access  Private
exports.getPaymentById = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate('student', 'firstName lastName email phone')
    .populate('seat', 'seatNumber')
    .populate('shift', 'name');

  if (!payment) {
    throw new ApiError(404, 'Payment not found');
  }

  res.status(200).json({
    success: true,
    data: payment
  });
});

// @desc    Create payment for assignment
// @route   POST /smlekha/payments
// @access  Private
exports.createPayment = asyncHandler(async (req, res) => {
  const { student, seat, shift, assignment, amount, paymentMethod, dueDate, period } = req.body;

  // Check if student exists
  const studentExists = await Student.findById(student);
  if (!studentExists) {
    throw new ApiError(404, 'Student not found');
  }

  // Check if assignment exists
  const assignmentExists = studentExists.currentAssignments.id(assignment);
  if (!assignmentExists) {
    throw new ApiError(404, 'Assignment not found');
  }

  const payment = await Payment.create({
    student,
    seat,
    shift,
    assignment,
    amount,
    paymentMethod,
    dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
    period: period || {
      start: new Date(),
      end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    },
    status: 'pending',
    createdBy: req.user.id
  });

  res.status(201).json({
    success: true,
    data: payment
  });
});

// @desc    Update payment
// @route   PUT /smlekha/payments/:id
// @access  Private
exports.updatePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    throw new ApiError(404, 'Payment not found');
  }

  if (payment.status === 'completed' || payment.status === 'refunded') {
    throw new ApiError(400, 'Cannot update a completed or refunded payment');
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

// @desc    Complete payment
// @route   PUT /smlekha/payments/:id/complete
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
  payment.paymentDate = new Date();
  payment.transactionId = req.body.transactionId;
  await payment.save();

  res.status(200).json({
    success: true,
    data: payment
  });
});

// @desc    Get payment statistics
// @route   GET /smlekha/payments/stats
// @access  Private/Admin
exports.getPaymentStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const query = {};

  if (startDate || endDate) {
    query.paymentDate = {};
    if (startDate) query.paymentDate.$gte = new Date(startDate);
    if (endDate) query.paymentDate.$lte = new Date(endDate);
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

  // Get overdue payments
  const overduePayments = await Payment.find({
    status: 'pending',
    dueDate: { $lt: new Date() }
  }).countDocuments();

  res.status(200).json({
    success: true,
    data: {
      stats,
      totalPayments,
      totalAmount: totalAmount[0]?.total || 0,
      overduePayments
    }
  });
});

// @desc    Get student payment history
// @route   GET /smlekha/payments/student/:studentId
// @access  Private
exports.getStudentPayments = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { startDate, endDate } = req.query;

  const query = { student: studentId };
  if (startDate || endDate) {
    query.paymentDate = {};
    if (startDate) query.paymentDate.$gte = new Date(startDate);
    if (endDate) query.paymentDate.$lte = new Date(endDate);
  }

  const payments = await Payment.find(query)
    .populate('seat', 'seatNumber')
    .populate('shift', 'name')
    .sort('-paymentDate');

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

// @desc    Get overdue payments
// @route   GET /smlekha/payments/overdue
// @access  Private
exports.getOverduePayments = asyncHandler(async (req, res) => {
  const overduePayments = await Payment.find({
    status: 'pending',
    dueDate: { $lt: new Date() }
  })
  .populate('student', 'firstName lastName email phone')
  .populate('seat', 'seatNumber')
  .populate('shift', 'name');

  res.status(200).json({
    success: true,
    data: overduePayments
  });
});