const { asyncHandler } = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const Seat = require('../models/Seat');
const Shift = require('../models/Shift');
const Property = require('../models/Property');
const mongoose = require('mongoose');

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

// Helper function to get latest payment method from installments
function getLatestPaymentMethod(installments) {
  if (!installments || installments.length === 0) return 'PENDING';
  const latest = installments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))[0];
  return mapPaymentMethodToUI(latest.paymentMethod);
}

// Helper function to get payment mode
function getPaymentMode(installments) {
  if (!installments || installments.length === 0) return 'Pending';
  const latest = installments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))[0];
  return latest.paymentMethod === 'cash' ? 'Cash' : 'Digital';
}

// Helper function to get latest transaction ID
function getLatestTransactionId(installments) {
  if (!installments || installments.length === 0) return null;
  const latest = installments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))[0];
  return latest.transactionId;
}

// Helper function to get latest receipt number
function getLatestReceiptNumber(installments) {
  if (!installments || installments.length === 0) return null;
  const latest = installments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))[0];
  return latest.receiptNumber;
}

// Helper function to transform payment for response (maintains API compatibility)
function transformPaymentForResponse(payment) {
  return {
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
    amount: payment.totalAmount,
    collectedAmount: payment.totalCollected,
    dueAmount: payment.totalAmount,
    balanceAmount: payment.balanceAmount,
    paymentMethod: getLatestPaymentMethod(payment.installments),
    paymentMode: getPaymentMode(payment.installments),
    status: payment.status === 'overdue' ? 'pending' : payment.status,
    date: payment.paymentDate || payment.createdAt,
    dueDate: payment.dueDate,
    description: payment.description,
    transactionId: getLatestTransactionId(payment.installments),
    receiptNumber: getLatestReceiptNumber(payment.installments),
    feeType: payment.feeType,
    period: payment.period,
    paymentBreakdown: payment.installments.map(inst => ({
      description: inst.description,
      amount: inst.amount,
      type: 'base_fee',
      date: inst.paymentDate
    })),
    notes: payment.notes,
    isOverdue: payment.status === 'overdue' || (payment.status === 'pending' && payment.dueDate && new Date() > new Date(payment.dueDate)),
    overdueDays: payment.daysOverdue || 0,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt
  };
}

// @desc    Get all payments with enhanced filtering
// @route   GET /smlekha/payments
// @access  Private
exports.getPayments = asyncHandler(async (req, res) => {
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
  
  if (student) query.student = student;
  if (status && status !== 'all') {
    let mappedStatus = status;
    if (status === 'pending') mappedStatus = { $in: ['pending', 'overdue'] };
    query.status = mappedStatus;
  }
  if (paymentMethod && paymentMethod !== 'all') {
    query.paymentMethod = mapPaymentMethod(paymentMethod);
  }
  if (propertyId) query.property = propertyId;
  
  // Handle date filtering
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
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
      { 'installments.transactionId': { $regex: search, $options: 'i' } }
    ];
  }

  // Define sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Execute query
  const payments = await Payment.find(query)
    .populate('student', 'firstName lastName email phone')
    .populate('seat', 'seatNumber row column')
    .populate('shift', 'name startTime endTime')
    .populate('property', 'name address')
    .sort(sort)
    .skip(skip)
    .limit(limitNum);

  const total = await Payment.countDocuments(query);

  // Transform data for frontend
  const transformedPayments = payments.map(payment => transformPaymentForResponse(payment));

  // Calculate summary statistics
  const summaryStats = await Payment.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$totalAmount' },
        totalCollected: { $sum: '$totalCollected' },
        totalPending: {
          $sum: {
            $cond: {
              if: { $in: ['$status', ['pending', 'overdue']] },
              then: '$balanceAmount',
              else: 0
            }
          }
        },
        totalBalance: { $sum: '$balanceAmount' },
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
    notes,
    previousPaymentId,
    isInstallment = true
  } = req.body;

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

  // Find or create payment record
  let payment = await Payment.findOne({
    assignment: activeAssignment._id
  });

  const monthlyRent = activeAssignment.monthlyRent || 1600;
  const numericCollected = parseFloat(collectedAmount);

  if (!payment) {
    // Create new payment record
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    payment = await Payment.create({
      student: studentId,
      seat: seat._id,
      shift: activeAssignment.shift,
      property: seat.propertyId,
      assignment: activeAssignment._id,
      totalAmount: monthlyRent,
      dueDate: dueDate,
      period: {
        start: activeAssignment.startDate,
        end: dueDate
      },
      feeType: feeType,
      description: `Seat rent for ${student.firstName} ${student.lastName || ''}`,
      createdBy: req.user?.id
    });
  }

  // Validate that collected amount doesn't exceed remaining balance
  if (numericCollected > payment.balanceAmount) {
    throw new ApiError(400, `Collected amount (₹${numericCollected}) exceeds remaining balance (₹${payment.balanceAmount})`);
  }

  // Add installment
  const installmentData = {
    amount: numericCollected,
    paymentMethod: mapPaymentMethod(paymentMethod),
    paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
    collectedBy: req.user?.id,
    description: description || `Payment installment`,
    receiptNumber: `RCPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    notes: notes
  };

  await payment.addInstallment(installmentData);

  // Populate the response
  const populatedPayment = await Payment.findById(payment._id)
    .populate('student', 'firstName lastName email phone')
    .populate('seat', 'seatNumber')
    .populate('shift', 'name startTime endTime')
    .populate('property', 'name address');

  // Enhanced receipt data
  const receiptData = {
    receiptNumber: installmentData.receiptNumber,
    transactionId: installmentData.transactionId,
    studentName: student.firstName + ' ' + (student.lastName || ''),
    studentId: studentId,
    studentEmail: student.email || '',
    studentPhone: student.phone || '',
    seatNo: seatNo,
    propertyName: property.name,
    propertyAddress: property.address,
    shiftName: populatedPayment.shift?.name || 'N/A',
    installmentAmount: numericCollected,
    installmentNumber: payment.installments.length,
    totalMonthlyRent: monthlyRent,
    totalCollectedSoFar: payment.totalCollected,
    remainingBalance: payment.balanceAmount,
    paymentMethod: paymentMethod,
    paymentMode: paymentMode,
    paymentDate: paymentDate || new Date().toISOString().split('T')[0],
    description: description,
    timestamp: new Date().toISOString(),
    period: payment.period,
    isInstallment: true
  };

  res.status(201).json({
    success: true,
    message: `Payment recorded successfully`,
    data: {
      payment: transformPaymentForResponse(populatedPayment),
      receipt: receiptData,
      overallProgress: {
        totalMonthlyRent: monthlyRent,
        totalCollected: payment.totalCollected,
        remainingBalance: payment.balanceAmount,
        installmentsCount: payment.installments.length
      }
    }
  });
});

// @desc    Get payment statistics
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
        totalAmount: { $sum: '$totalAmount' },
        totalCollected: { $sum: '$totalCollected' },
        totalBalance: { $sum: '$balanceAmount' }
      }
    }
  ]);

  const totalPayments = await Payment.countDocuments(query);
  const totalAmount = await Payment.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        total: { $sum: '$totalAmount' },
        totalCollected: { $sum: '$totalCollected' },
        totalBalance: { $sum: '$balanceAmount' }
      }
    }
  ]);

  // Get overdue payments
  const overduePayments = await Payment.countDocuments({
    status: { $in: ['pending', 'partial', 'overdue'] },
    dueDate: { $lt: new Date() }
  });

  res.status(200).json({
    success: true,
    data: {
      stats: stats.map(stat => ({
        ...stat,
        _id: stat._id === 'overdue' ? 'pending' : stat._id
      })),
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
    status: { $in: ['pending', 'partial', 'overdue'] },
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

  // Transform data for frontend compatibility
  const transformedPayments = overduePayments.map(payment => transformPaymentForResponse(payment));

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
      totalOverdueAmount: transformedPayments.reduce((sum, payment) => sum + payment.balanceAmount, 0),
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
    let mappedStatus = status;
    if (status === 'pending') mappedStatus = { $in: ['pending', 'overdue'] };
    query.status = mappedStatus;
  }

  const payments = await Payment.find(query)
    .populate('seat', 'seatNumber')
    .populate('shift', 'name')
    .populate('property', 'name address')
    .sort('-createdAt')
    .skip(skip)
    .limit(limitNum);

  const total = await Payment.countDocuments(query);

  // Calculate student payment statistics
  const paymentStats = await Payment.aggregate([
    { $match: { student: new mongoose.Types.ObjectId(studentId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        totalCollected: { $sum: '$totalCollected' },
        totalBalance: { $sum: '$balanceAmount' }
      }
    }
  ]);

  // Transform data for frontend compatibility
  const transformedPayments = payments.map(payment => ({
    id: payment._id.toString(),
    receiptNumber: getLatestReceiptNumber(payment.installments),
    studentId: studentId,
    amount: payment.totalAmount,
    collectedAmount: payment.totalCollected,
    balanceAmount: payment.balanceAmount,
    paymentMethod: getLatestPaymentMethod(payment.installments),
    status: payment.status === 'overdue' ? 'pending' : payment.status,
    date: payment.paymentDate || payment.createdAt,
    dueDate: payment.dueDate,
    description: payment.description,
    transactionId: getLatestTransactionId(payment.installments),
    seatNo: payment.seat?.seatNumber || 'N/A',
    shiftName: payment.shift?.name || 'N/A',
    property: payment.property ? {
      name: payment.property.name,
      address: payment.property.address
    } : null
  }));

  // Calculate summary statistics
  const summary = {
    totalPayments: total,
    totalAmount: paymentStats.reduce((sum, stat) => sum + stat.totalAmount, 0),
    totalCollected: paymentStats.reduce((sum, stat) => sum + stat.totalCollected, 0),
    totalBalance: paymentStats.reduce((sum, stat) => sum + stat.totalBalance, 0),
    paymentCounts: paymentStats.reduce((acc, stat) => {
      const statusKey = stat._id === 'overdue' ? 'pending' : stat._id;
      acc[statusKey] = (acc[statusKey] || 0) + stat.count;
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

  const transformedPayment = transformPaymentForResponse(payment);

  res.status(200).json({
    success: true,
    data: transformedPayment
  });
});

// @desc    Add installment to payment
// @route   POST /smlekha/payments/:id/installments
// @access  Private
exports.addInstallment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    throw new ApiError(404, 'Payment not found');
  }

  const {
    amount,
    paymentMethod,
    paymentDate,
    description,
    receiptNumber,
    notes
  } = req.body;

  const installmentData = {
    amount: parseFloat(amount),
    paymentMethod: mapPaymentMethod(paymentMethod),
    paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
    collectedBy: req.user?.id,
    description: description || `Additional payment installment`,
    receiptNumber: receiptNumber,
    notes: notes
  };

  await payment.addInstallment(installmentData);

  const updatedPayment = await Payment.findById(payment._id)
    .populate('student', 'firstName lastName email phone')
    .populate('seat', 'seatNumber')
    .populate('shift', 'name startTime endTime')
    .populate('property', 'name address');

  res.status(200).json({
    success: true,
    message: 'Installment added successfully',
    data: {
      payment: transformPaymentForResponse(updatedPayment),
      installment: installmentData,
      paymentProgress: updatedPayment.getPaymentProgress()
    }
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
    'totalAmount', 'dueDate', 'description', 'notes', 'feeType', 'period'
  ];
  
  const updates = {};
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

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
    data: transformPaymentForResponse(updatedPayment)
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

  // Add final installment to complete the payment
  const remainingBalance = payment.balanceAmount;
  if (remainingBalance > 0) {
    const installmentData = {
      amount: remainingBalance,
      paymentMethod: payment.paymentMethod,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      collectedBy: req.user?.id,
      description: 'Final payment to complete',
      receiptNumber: `RCPT-${Date.now()}`,
      notes: notes
    };

    await payment.addInstallment(installmentData);
  }

  const populatedPayment = await Payment.findById(payment._id)
    .populate('student', 'firstName lastName email phone')
    .populate('seat', 'seatNumber')
    .populate('shift', 'name')
    .populate('property', 'name');

  res.status(200).json({
    success: true,
    message: 'Payment completed successfully',
    data: transformPaymentForResponse(populatedPayment)
  });
});

// @desc    Get payment summary for dashboard
// @route   GET /smlekha/payments/stats/dashboard
// @access  Private
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const { propertyId, startDate, endDate } = req.query;
  
  const match = { status: { $in: ['completed', 'partial', 'pending', 'overdue'] } };
  
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
        totalAmount: { $sum: '$totalAmount' },
        totalCollected: { $sum: '$totalCollected' },
        totalBalance: { $sum: '$balanceAmount' }
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
    if (stat._id === 'pending' || stat._id === 'overdue') {
      summary.duePayments += stat.totalBalance;
    } else if (stat._id === 'partial') {
      summary.duePayments += stat.totalBalance;
      summary.collections += stat.totalCollected;
    } else if (stat._id === 'completed') {
      summary.collections += stat.totalCollected;
    }
  });

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
    amount: payment.totalCollected,
    date: payment.paymentDate || payment.createdAt,
    status: payment.status
  }));

  res.status(200).json({
    success: true,
    data: {
      summary,
      stats,
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
    receiptNumber: getLatestReceiptNumber(payment.installments),
    transactionId: getLatestTransactionId(payment.installments),
    studentName: payment.student ? `${payment.student.firstName} ${payment.student.lastName || ''}`.trim() : 'Unknown Student',
    studentId: payment.student?._id?.toString() || '',
    studentEmail: payment.student?.email || '',
    studentPhone: payment.student?.phone || '',
    seatNo: payment.seat?.seatNumber || 'N/A',
    propertyName: payment.property?.name || 'N/A',
    propertyAddress: payment.property?.address || 'N/A',
    shiftName: payment.shift?.name || 'N/A',
    dueAmount: payment.totalAmount,
    collectedAmount: payment.totalCollected,
    balanceAmount: payment.balanceAmount,
    paymentMethod: getLatestPaymentMethod(payment.installments),
    paymentMode: getPaymentMode(payment.installments),
    paymentDate: payment.paymentDate || payment.createdAt,
    description: payment.description,
    period: payment.period,
    status: payment.status,
    createdBy: payment.createdBy?.name || 'System',
    timestamp: new Date().toISOString(),
    installments: payment.installments
  };

  res.status(200).json({
    success: true,
    data: receiptData
  });
});

// @desc    Get payment summary for a student
// @route   GET /smlekha/payments/student/:studentId/summary
// @access  Private
exports.getStudentPaymentSummary = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { seatId, assignmentId } = req.query;

  const student = await Student.findById(studentId);
  if (!student) {
    throw new ApiError(404, 'Student not found');
  }

  const query = {
    student: studentId,
    feeType: 'seat_rent'
  };

  if (seatId) query.seat = seatId;
  if (assignmentId) query.assignment = assignmentId;

  const payments = await Payment.find(query)
    .populate('seat', 'seatNumber')
    .sort({ paymentDate: 1 });

  const monthlyRent = 1600;
  const totalCollected = payments.reduce((sum, payment) => sum + payment.totalCollected, 0);
  const remainingBalance = payments.reduce((sum, payment) => sum + payment.balanceAmount, 0);

  res.status(200).json({
    success: true,
    data: {
      student: {
        id: student._id,
        name: student.firstName + ' ' + (student.lastName || ''),
        email: student.email,
        phone: student.phone
      },
      summary: {
        monthlyRent,
        totalCollected,
        remainingBalance,
        paymentCount: payments.length,
        lastPayment: payments[payments.length - 1] ? transformPaymentForResponse(payments[payments.length - 1]) : null
      },
      paymentHistory: payments.map(payment => transformPaymentForResponse(payment))
    }
  });
});