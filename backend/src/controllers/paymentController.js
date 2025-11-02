// controllers/paymentController.js - Updated to use new Payment model fields
const { asyncHandler } = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const Seat = require('../models/Seat');
const Shift = require('../models/Shift');
const Property = require('../models/Property');
const mongoose = require('mongoose');

// @desc    Get all payments with enhanced filtering
// @route   GET /smlekha/payments
// @access  Private
exports.getPayments = asyncHandler(async (req, res) => {
  console.log('=== DEBUG: GET PAYMENTS ===');
  console.log('Query params:', req.query);

  const {
    page = 1,
    limit = 10,
    student,
    status,
    paymentMethod,
    startDate,
    endDate,
    propertyId,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Build query
  const query = {};
  
  console.log('Initial query:', query);

  // Build the actual query
  if (student) query.student = student;
  if (status && status !== 'all') query.status = status;
  if (paymentMethod && paymentMethod !== 'all') {
    query.paymentMethod = mapPaymentMethod(paymentMethod);
  }
  if (propertyId) query.property = propertyId;
  
  // Handle date filtering properly
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      const actualStartDate = new Date(startDate);
      console.log('Start date:', actualStartDate);
      query.createdAt.$gte = actualStartDate;
    }
    if (endDate) {
      const actualEndDate = new Date(endDate);
      console.log('End date:', actualEndDate);
      query.createdAt.$lte = actualEndDate;
    }
  }

  // Search filter
  if (search) {
    const studentIds = await Student.find({
      $or: [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ]
    }).select('_id');
    
    query.$or = [
      { student: { $in: studentIds.map(s => s._id) } },
      { transactionId: { $regex: search, $options: 'i' } },
      { 'seat.seatNumber': { $regex: search, $options: 'i' } }
    ];
  }

  console.log('Final query:', JSON.stringify(query, null, 2));

  // Define sort object properly
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  console.log('Sort object:', sort);

  // Execute the actual query
  const payments = await Payment.find(query)
    .populate('student', 'firstName lastName email phone')
    .populate('seat', 'seatNumber row column')
    .populate('shift', 'name startTime endTime')
    .populate('property', 'name address')
    .sort(sort)
    .skip(skip)
    .limit(limitNum);

  console.log('Final payments found:', payments.length);

  const total = await Payment.countDocuments(query);
  console.log('Total matching documents:', total);

  // Transform data for frontend - USING NEW MODEL FIELDS
  const transformedPayments = payments.map(payment => ({
    id: payment._id.toString(),
    studentId: payment.student?._id?.toString() || '',
    studentName: payment.student ? `${payment.student.firstName} ${payment.student.lastName || ''}`.trim() : 'Unknown Student',
    studentEmail: payment.student?.email || '',
    studentPhone: payment.student?.phone || '',
    seatNo: payment.seat?.seatNumber || 'N/A',
    seatDetails: payment.seat ? {
      seatNumber: payment.seat.seatNumber,
      row: payment.seat.row,
      column: payment.seat.column
    } : null,
    shift: payment.shift ? {
      name: payment.shift.name,
      startTime: payment.shift.startTime,
      endTime: payment.shift.endTime
    } : null,
    property: payment.property ? {
      name: payment.property.name,
      address: payment.property.address
    } : null,
    amount: payment.amount,
    collectedAmount: payment.collectedAmount, // Use direct field
    dueAmount: payment.amount,
    balanceAmount: payment.balanceAmount, // Use direct field
    paymentMethod: mapPaymentMethodToUI(payment.paymentMethod),
    paymentMode: payment.paymentMethod === 'cash' ? 'Cash' : 'Digital',
    status: payment.status,
    date: payment.paymentDate || payment.createdAt,
    dueDate: payment.dueDate,
    description: payment.description,
    transactionId: payment.transactionId,
    receiptNumber: payment.transactionId,
    feeType: payment.feeType,
    period: payment.period,
    paymentBreakdown: payment.paymentBreakdown,
    notes: payment.notes,
    isOverdue: payment.status === 'pending' && payment.dueDate && new Date() > new Date(payment.dueDate),
    overdueDays: payment.status === 'pending' && payment.dueDate ? 
      Math.ceil((new Date() - new Date(payment.dueDate)) / (1000 * 60 * 60 * 24)) : 0,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt
  }));

  // Calculate summary statistics using new fields
  const summaryStats = await Payment.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalCollected: { $sum: '$collectedAmount' }, // Use collectedAmount field
        totalPending: {
          $sum: {
            $cond: {
              if: { $eq: ['$status', 'pending'] },
              then: '$amount',
              else: 0
            }
          }
        },
        totalBalance: { $sum: '$balanceAmount' }, // Use balanceAmount field
        paymentCount: { $sum: 1 }
      }
    }
  ]);

  const summary = summaryStats[0] || {
    totalAmount: 0,
    totalCollected: 0,
    totalPending: 0,
    totalBalance: 0,
    paymentCount: 0
  };

  res.status(200).json({
    success: true,
    data: transformedPayments,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    },
    summary: {
      totalPayments: summary.paymentCount,
      totalAmount: summary.totalAmount,
      totalCollected: summary.totalCollected,
      totalPending: summary.totalPending,
      totalBalance: summary.totalBalance
    }
  });
});

// @desc    Create payment with proper integration
// @route   POST /smlekha/payments
// @access  Private
exports.createPayment = asyncHandler(async (req, res) => {
  const {
    studentId,
    studentName,
    seatNo,
    dueAmount,
    collectedAmount,
    balanceAmount,
    paymentMethod,
    paymentMode,
    paymentDate,
    description,
    shift,
    assignment,
    feeType = 'seat_rent',
    paymentBreakdown = [],
    notes
  } = req.body;

  console.log('=== CREATE PAYMENT START ===');
  console.log('Payment data:', req.body);

  // Validate required fields
  if (!studentId || !collectedAmount || !paymentMethod) {
    throw new ApiError(400, 'Student ID, collected amount, and payment method are required');
  }

  // Find student and seat
  const student = await Student.findById(studentId);
  if (!student) {
    throw new ApiError(404, 'Student not found');
  }

  const seat = await Seat.findOne({ seatNumber: seatNo });
  if (!seat) {
    throw new ApiError(404, 'Seat not found');
  }

  // Find property
  const property = await Property.findById(seat.propertyId);
  if (!property) {
    throw new ApiError(404, 'Property not found');
  }

  // Find active assignment
  const activeAssignment = student.currentAssignments.find(
    assignment => assignment.status === 'active' && 
    assignment.seat.toString() === seat._id.toString()
  );

  if (!activeAssignment) {
    throw new ApiError(400, 'No active assignment found for this student and seat');
  }

  // Generate receipt and transaction IDs
  const receiptNumber = `RCPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Use provided values or calculate
  const numericAmount = parseFloat(dueAmount);
  const numericCollected = parseFloat(collectedAmount);
  const numericBalance = parseFloat(balanceAmount) || (numericAmount - numericCollected);
  
  // Determine payment status based on collected amount
  let status = 'pending';
  if (numericCollected === numericAmount) {
    status = 'completed';
  } else if (numericCollected > 0 && numericCollected < numericAmount) {
    status = 'partial';
  }

  // Create payment record with new fields
  const paymentData = {
    student: studentId,
    seat: seat._id,
    shift: activeAssignment.shift,
    property: seat.propertyId,
    assignment: activeAssignment._id,
    amount: numericAmount,
    collectedAmount: numericCollected,
    balanceAmount: numericBalance,
    status: status,
    paymentMethod: mapPaymentMethod(paymentMethod),
    transactionId: transactionId,
    paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
    dueDate: activeAssignment.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    period: {
      start: activeAssignment.startDate,
      end: activeAssignment.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    },
    feeType: feeType,
    description: description,
    paymentBreakdown: paymentBreakdown.length > 0 ? paymentBreakdown : [
      {
        description: 'Seat Rent Payment',
        amount: numericCollected,
        type: 'base_fee',
        date: new Date()
      }
    ],
    createdBy: req.user?.id,
    notes: notes
  };

  console.log('Creating payment with data:', paymentData);

  const payment = await Payment.create(paymentData);

  // Populate the response
  const populatedPayment = await Payment.findById(payment._id)
    .populate('student', 'firstName lastName email phone')
    .populate('seat', 'seatNumber')
    .populate('shift', 'name startTime endTime')
    .populate('property', 'name address');

  console.log('=== CREATE PAYMENT END - SUCCESS ===');

  // Enhanced receipt data
  const receiptData = {
    receiptNumber: receiptNumber,
    transactionId: transactionId,
    studentName: student.firstName + ' ' + (student.lastName || ''),
    studentId: studentId,
    studentEmail: student.email || '',
    studentPhone: student.phone || '',
    seatNo: seatNo,
    propertyName: property.name,
    propertyAddress: property.address,
    shiftName: populatedPayment.shift?.name || 'N/A',
    dueAmount: numericAmount,
    collectedAmount: numericCollected,
    balanceAmount: numericBalance,
    paymentMethod: paymentMethod,
    paymentMode: paymentMode,
    paymentDate: paymentDate || new Date().toISOString().split('T')[0],
    description: description,
    timestamp: new Date().toISOString(),
    period: paymentData.period
  };

  res.status(201).json({
    success: true,
    message: 'Payment recorded successfully',
    data: {
      payment: populatedPayment,
      receipt: receiptData
    }
  });
});

// @desc    Get payment statistics (original function)
// @route   GET /smlekha/payments/stats/payment-stats
// @access  Private
exports.getPaymentStats = asyncHandler(async (req, res) => {
  const { startDate, endDate, propertyId } = req.query;
  const query = {};

  if (propertyId) query.property = propertyId;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const stats = await Payment.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalCollected: { $sum: '$collectedAmount' }, // Use new field
        totalBalance: { $sum: '$balanceAmount' } // Use new field
      }
    }
  ]);

  const totalPayments = await Payment.countDocuments(query);
  const totalAmount = await Payment.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
        totalCollected: { $sum: '$collectedAmount' }, // Use new field
        totalBalance: { $sum: '$balanceAmount' } // Use new field
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
      totalCollected: totalAmount[0]?.totalCollected || 0,
      totalBalance: totalAmount[0]?.totalBalance || 0,
      overduePayments
    }
  });
});

// @desc    Get overdue payments
// @route   GET /smlekha/payments/overdue
// @access  Private
exports.getOverduePayments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, propertyId } = req.query;
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const query = {
    status: 'pending',
    dueDate: { $lt: new Date() }
  };

  if (propertyId) query.property = propertyId;

  const overduePayments = await Payment.find(query)
    .populate('student', 'firstName lastName email phone')
    .populate('seat', 'seatNumber')
    .populate('shift', 'name')
    .populate('property', 'name address')
    .sort('dueDate')
    .skip(skip)
    .limit(limitNum);

  const total = await Payment.countDocuments(query);

  // Transform data for frontend compatibility - USING NEW FIELDS
  const transformedPayments = overduePayments.map(payment => ({
    id: payment._id.toString(),
    studentId: payment.student?._id?.toString() || '',
    studentName: payment.student ? `${payment.student.firstName} ${payment.student.lastName || ''}`.trim() : 'Unknown Student',
    studentEmail: payment.student?.email || '',
    studentPhone: payment.student?.phone || '',
    seatNo: payment.seat?.seatNumber || 'N/A',
    property: payment.property ? {
      name: payment.property.name,
      address: payment.property.address
    } : null,
    amount: payment.amount,
    dueAmount: payment.amount,
    collectedAmount: payment.collectedAmount, // Use direct field
    balanceAmount: payment.balanceAmount, // Use direct field
    paymentMethod: mapPaymentMethodToUI(payment.paymentMethod),
    paymentMode: payment.paymentMethod === 'cash' ? 'Cash' : 'Digital',
    status: payment.status,
    date: payment.paymentDate || payment.createdAt,
    dueDate: payment.dueDate,
    overdueDays: Math.ceil((new Date() - new Date(payment.dueDate)) / (1000 * 60 * 60 * 24)),
    description: payment.description,
    transactionId: payment.transactionId
  }));

  res.status(200).json({
    success: true,
    data: transformedPayments,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    },
    summary: {
      totalOverdue: total,
      totalOverdueAmount: transformedPayments.reduce((sum, payment) => sum + payment.amount, 0),
      totalCollected: transformedPayments.reduce((sum, payment) => sum + payment.collectedAmount, 0),
      totalBalance: transformedPayments.reduce((sum, payment) => sum + payment.balanceAmount, 0),
      averageOverdueDays: transformedPayments.reduce((sum, payment) => sum + payment.overdueDays, 0) / transformedPayments.length || 0
    }
  });
});

// @desc    Get payments by student ID
// @route   GET /smlekha/payments/student/:studentId
// @access  Private
exports.getStudentPayments = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { page = 1, limit = 10, status } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Build query
  const query = { student: studentId };
  if (status && status !== 'all') {
    query.status = status;
  }

  const payments = await Payment.find(query)
    .populate('seat', 'seatNumber')
    .populate('shift', 'name')
    .populate('property', 'name address')
    .sort('-createdAt')
    .skip(skip)
    .limit(limitNum);

  const total = await Payment.countDocuments(query);

  // Calculate student payment statistics using new fields
  const paymentStats = await Payment.aggregate([
    { $match: { student: new mongoose.Types.ObjectId(studentId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalCollected: { $sum: '$collectedAmount' }, // Use new field
        totalBalance: { $sum: '$balanceAmount' } // Use new field
      }
    }
  ]);

  // Transform data for frontend compatibility - USING NEW FIELDS
  const transformedPayments = payments.map(payment => ({
    id: payment._id.toString(),
    receiptNumber: payment.transactionId,
    studentId: studentId,
    amount: payment.amount,
    collectedAmount: payment.collectedAmount, // Use direct field
    balanceAmount: payment.balanceAmount, // Use direct field
    paymentMethod: mapPaymentMethodToUI(payment.paymentMethod),
    status: payment.status,
    date: payment.paymentDate || payment.createdAt,
    dueDate: payment.dueDate,
    description: payment.description,
    transactionId: payment.transactionId,
    seatNo: payment.seat?.seatNumber || 'N/A',
    shiftName: payment.shift?.name || 'N/A',
    property: payment.property ? {
      name: payment.property.name,
      address: payment.property.address
    } : null
  }));

  // Calculate summary statistics using new fields
  const summary = {
    totalPayments: total,
    totalAmount: paymentStats.reduce((sum, stat) => sum + stat.totalAmount, 0),
    totalCollected: paymentStats.reduce((sum, stat) => sum + stat.totalCollected, 0),
    totalBalance: paymentStats.reduce((sum, stat) => sum + stat.totalBalance, 0),
    paymentCounts: paymentStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {})
  };

  res.status(200).json({
    success: true,
    data: transformedPayments,
    summary,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
});

// @desc    Generate payment report
// @route   GET /smlekha/payments/report
// @access  Private
exports.generatePaymentReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, propertyId, reportType = 'monthly', format = 'json' } = req.query;

  const match = { status: { $in: ['completed', 'partial'] } };
  
  if (propertyId) match.property = propertyId;
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }

  let groupBy;
  switch (reportType) {
    case 'daily':
      groupBy = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' }
      };
      break;
    case 'weekly':
      groupBy = {
        year: { $year: '$createdAt' },
        week: { $week: '$createdAt' }
      };
      break;
    case 'yearly':
      groupBy = {
        year: { $year: '$createdAt' }
      };
      break;
    default: // monthly
      groupBy = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' }
      };
  }

  const report = await Payment.aggregate([
    { $match: match },
    {
      $group: {
        _id: groupBy,
        totalCollections: { $sum: '$collectedAmount' }, // Use new field
        totalDue: { $sum: '$amount' },
        totalBalance: { $sum: '$balanceAmount' }, // Use new field
        paymentCount: { $sum: 1 },
        averagePayment: { $avg: '$amount' },
        minPayment: { $min: '$amount' },
        maxPayment: { $max: '$amount' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
  ]);

  // Get payment method distribution
  const paymentMethodStats = await Payment.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$paymentMethod',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalCollected: { $sum: '$collectedAmount' } // Use new field
      }
    }
  ]);

  // Get status distribution
  const statusStats = await Payment.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalCollected: { $sum: '$collectedAmount' } // Use new field
      }
    }
  ]);

  const reportData = {
    reportType,
    period: { 
      startDate: startDate || 'Beginning', 
      endDate: endDate || 'Current' 
    },
    summary: {
      totalCollections: report.reduce((sum, item) => sum + item.totalCollections, 0),
      totalDue: report.reduce((sum, item) => sum + item.totalDue, 0),
      totalBalance: report.reduce((sum, item) => sum + item.totalBalance, 0),
      totalPayments: report.reduce((sum, item) => sum + item.paymentCount, 0),
      averagePayment: report.reduce((sum, item) => sum + item.averagePayment, 0) / report.length || 0
    },
    timeSeries: report,
    paymentMethodDistribution: paymentMethodStats,
    statusDistribution: statusStats,
    generatedAt: new Date().toISOString()
  };

  res.status(200).json({
    success: true,
    data: reportData
  });
});

// @desc    Get payment by ID
// @route   GET /smlekha/payments/:id
// @access  Private
exports.getPaymentById = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate('student', 'firstName lastName email phone')
    .populate('seat', 'seatNumber row column')
    .populate('shift', 'name startTime endTime')
    .populate('property', 'name address')
    .populate('createdBy', 'name email');

  if (!payment) {
    throw new ApiError(404, 'Payment not found');
  }

  // Transform data for frontend compatibility - USING NEW FIELDS
  const transformedPayment = {
    id: payment._id.toString(),
    studentId: payment.student?._id?.toString() || '',
    studentName: payment.student ? `${payment.student.firstName} ${payment.student.lastName || ''}`.trim() : 'Unknown Student',
    studentEmail: payment.student?.email || '',
    studentPhone: payment.student?.phone || '',
    seatNo: payment.seat?.seatNumber || 'N/A',
    seatDetails: payment.seat ? {
      seatNumber: payment.seat.seatNumber,
      row: payment.seat.row,
      column: payment.seat.column
    } : null,
    shift: payment.shift ? {
      name: payment.shift.name,
      startTime: payment.shift.startTime,
      endTime: payment.shift.endTime
    } : null,
    property: payment.property ? {
      name: payment.property.name,
      address: payment.property.address
    } : null,
    amount: payment.amount,
    collectedAmount: payment.collectedAmount, // Use direct field
    dueAmount: payment.amount,
    balanceAmount: payment.balanceAmount, // Use direct field
    paymentMethod: mapPaymentMethodToUI(payment.paymentMethod),
    paymentMode: payment.paymentMethod === 'cash' ? 'Cash' : 'Digital',
    status: payment.status,
    date: payment.paymentDate || payment.createdAt,
    dueDate: payment.dueDate,
    description: payment.description,
    transactionId: payment.transactionId,
    receiptNumber: payment.transactionId,
    feeType: payment.feeType,
    period: payment.period,
    paymentBreakdown: payment.paymentBreakdown,
    notes: payment.notes,
    createdBy: payment.createdBy ? {
      name: payment.createdBy.name,
      email: payment.createdBy.email
    } : null,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt
  };

  res.status(200).json({
    success: true,
    data: transformedPayment
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

  // Only allow certain fields to be updated
  const allowedUpdates = [
    'amount', 'collectedAmount', 'balanceAmount', 'paymentMethod', 'dueDate', 
    'description', 'paymentBreakdown', 'notes', 'feeType', 'period'
  ];
  
  const updates = {};
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  // Handle payment method mapping
  if (updates.paymentMethod) {
    updates.paymentMethod = mapPaymentMethod(updates.paymentMethod);
  }

  const updatedPayment = await Payment.findByIdAndUpdate(
    req.params.id,
    updates,
    {
      new: true,
      runValidators: true
    }
  )
  .populate('student', 'firstName lastName email phone')
  .populate('seat', 'seatNumber')
  .populate('shift', 'name')
  .populate('property', 'name');

  res.status(200).json({
    success: true,
    message: 'Payment updated successfully',
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

  const { transactionId, paymentDate, notes } = req.body;

  payment.status = 'completed';
  payment.paymentDate = paymentDate ? new Date(paymentDate) : new Date();
  payment.transactionId = transactionId || payment.transactionId;
  payment.notes = notes || payment.notes;
  
  await payment.save();

  const populatedPayment = await Payment.findById(payment._id)
    .populate('student', 'firstName lastName email phone')
    .populate('seat', 'seatNumber')
    .populate('shift', 'name')
    .populate('property', 'name');

  res.status(200).json({
    success: true,
    message: 'Payment completed successfully',
    data: populatedPayment
  });
});

// @desc    Refund payment
// @route   PUT /smlekha/payments/:id/refund
// @access  Private
exports.refundPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    throw new ApiError(404, 'Payment not found');
  }

  if (payment.status !== 'completed') {
    throw new ApiError(400, 'Only completed payments can be refunded');
  }

  const { refundAmount, reason, processedBy } = req.body;

  const refundAmt = refundAmount || payment.amount;

  if (refundAmt > payment.amount) {
    throw new ApiError(400, 'Refund amount cannot exceed payment amount');
  }

  payment.status = 'refunded';
  payment.refundDetails = {
    amount: refundAmt,
    reason: reason || 'Payment refund',
    refundDate: new Date(),
    processedBy: processedBy || req.user?.id
  };

  await payment.save();

  const populatedPayment = await Payment.findById(payment._id)
    .populate('student', 'firstName lastName email phone')
    .populate('seat', 'seatNumber')
    .populate('shift', 'name');

  res.status(200).json({
    success: true,
    message: `Payment refunded successfully. Amount: ${refundAmt}`,
    data: populatedPayment
  });
});

// @desc    Delete payment
// @route   DELETE /smlekha/payments/:id
// @access  Private/Admin
exports.deletePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    throw new ApiError(404, 'Payment not found');
  }

  // Only allow deletion of pending or failed payments
  if (payment.status === 'completed' || payment.status === 'refunded') {
    throw new ApiError(400, 'Cannot delete completed or refunded payments');
  }

  await Payment.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Payment deleted successfully',
    data: {
      id: req.params.id,
      transactionId: payment.transactionId
    }
  });
});

// @desc    Get payments summary for dashboard
// @route   GET /smlekha/payments/stats/dashboard
// @access  Private
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const { propertyId, startDate, endDate } = req.query;
  
  const match = { status: { $in: ['completed', 'partial', 'pending'] } };
  
  if (propertyId) match.property = propertyId;
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }

  const stats = await Payment.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalCollected: { $sum: '$collectedAmount' }, // Use new field
        totalBalance: { $sum: '$balanceAmount' } // Use new field
      }
    }
  ]);

  // Calculate summary for frontend
  const summary = {
    duePayments: 0,
    collections: 0,
    expenses: 0
  };

  stats.forEach(stat => {
    if (stat._id === 'pending') {
      summary.duePayments = stat.totalAmount;
    } else if (stat._id === 'completed' || stat._id === 'partial') {
      summary.collections += stat.totalCollected;
    } else if (stat._id === 'failed') {
      summary.expenses += stat.totalAmount;
    }
  });

  // Get monthly trend using new fields
  const monthlyTrend = await Payment.aggregate([
    {
      $match: {
        status: { $in: ['completed', 'partial'] },
        createdAt: { 
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          $lte: new Date()
        }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        dailyCollection: { $sum: '$collectedAmount' }, // Use new field
        paymentCount: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);

  // Get recent payments
  const recentPayments = await Payment.find({
    status: { $in: ['completed', 'partial'] }
  })
  .populate('student', 'firstName lastName')
  .populate('seat', 'seatNumber')
  .populate('property', 'name')
  .sort('-createdAt')
  .limit(5);

  const transformedRecentPayments = recentPayments.map(payment => ({
    id: payment._id.toString(),
    studentName: payment.student ? `${payment.student.firstName} ${payment.student.lastName || ''}`.trim() : 'Unknown',
    seatNo: payment.seat?.seatNumber || 'N/A',
    propertyName: payment.property?.name || 'N/A',
    amount: payment.collectedAmount, // Use new field
    date: payment.paymentDate || payment.createdAt,
    status: payment.status
  }));

  res.status(200).json({
    success: true,
    data: {
      summary,
      stats,
      monthlyTrend,
      recentPayments: transformedRecentPayments
    }
  });
});

// @desc    Generate PDF receipt for payment
// @route   GET /smlekha/payments/:id/receipt
// @access  Private
exports.generateReceipt = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate('student', 'firstName lastName email phone')
    .populate('seat', 'seatNumber')
    .populate('shift', 'name')
    .populate('property', 'name address')
    .populate('createdBy', 'name');

  if (!payment) {
    throw new ApiError(404, 'Payment not found');
  }

  // Enhanced receipt data
  const receiptData = {
    receiptNumber: payment.transactionId,
    transactionId: payment.transactionId,
    studentName: payment.student ? `${payment.student.firstName} ${payment.student.lastName || ''}`.trim() : 'Unknown Student',
    studentId: payment.student?._id?.toString() || '',
    studentEmail: payment.student?.email || '',
    studentPhone: payment.student?.phone || '',
    seatNo: payment.seat?.seatNumber || 'N/A',
    propertyName: payment.property?.name || 'N/A',
    propertyAddress: payment.property?.address || 'N/A',
    shiftName: payment.shift?.name || 'N/A',
    dueAmount: payment.amount,
    collectedAmount: payment.collectedAmount, // Use new field
    balanceAmount: payment.balanceAmount, // Use new field
    paymentMethod: mapPaymentMethodToUI(payment.paymentMethod),
    paymentMode: payment.paymentMethod === 'cash' ? 'Cash' : 'Digital',
    paymentDate: payment.paymentDate || payment.createdAt,
    description: payment.description,
    period: payment.period,
    status: payment.status,
    createdBy: payment.createdBy?.name || 'System',
    timestamp: new Date().toISOString()
  };

  res.status(200).json({
    success: true,
    data: receiptData
  });
});

// Helper function to map UI payment method to backend
function mapPaymentMethod(uiMethod) {
  const methodMap = {
    'CASH': 'cash',
    'PHONEPE': 'online',
    'PAYTM': 'online',
    'UPI': 'online',
    'CARD': 'card',
    'BANK_TRANSFER': 'bank_transfer',
    'PENDING': 'pending'
  };
  return methodMap[uiMethod] || 'cash';
}

// Helper function to map backend payment method to UI
function mapPaymentMethodToUI(backendMethod) {
  const methodMap = {
    'cash': 'CASH',
    'online': 'UPI',
    'card': 'CARD',
    'bank_transfer': 'BANK_TRANSFER',
    'pending': 'PENDING'
  };
  return methodMap[backendMethod] || 'CASH';
}