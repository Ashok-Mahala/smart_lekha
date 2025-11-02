// controllers/studentController.js - Updated with new Payment model fields
const Student = require('../models/Student');
const Seat = require('../models/Seat');
const Shift = require('../models/Shift');
const Payment = require('../models/Payment');
const ApiError = require('../utils/ApiError');
const { asyncHandler } = require('../utils/asyncHandler');
const mongoose = require('mongoose');

// Enhanced getStudentsByProperty to include payment details
const getStudentsByProperty = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  if (!propertyId) throw new ApiError(400, 'Property ID is required');

  const students = await Student.find()
    .populate({
      path: 'currentAssignments.seat',
      match: { propertyId },
      select: 'seatNumber row column propertyId'
    })
    .populate({
      path: 'currentAssignments.shift',
      select: 'name startTime endTime fee'
    })
    .populate({
      path: 'currentAssignments.payment',
      select: 'amount collectedAmount balanceAmount status paymentDate transactionId dueDate period'
    })
    .sort({ createdAt: -1 });

  // Filter students with assignments in this property
  const filteredStudents = students.filter(student => 
    student.currentAssignments.some(assignment => 
      assignment.seat && assignment.seat.propertyId.toString() === propertyId
    )
  );

  // Enhance response with proper payment summary
  const enhancedStudents = filteredStudents.map(student => {
    // Get assignments for this specific property
    const propertyAssignments = student.currentAssignments.filter(assignment => 
      assignment.seat && assignment.seat.propertyId.toString() === propertyId
    );

    let totalDue = 0;
    let totalPaid = 0;
    let totalAssigned = 0;

    propertyAssignments.forEach(assignment => {
      const payment = assignment.payment;
      const shiftFee = assignment.shift?.fee || 0;
      
      if (payment) {
        // Use payment data if available
        totalAssigned += payment.amount;
        
        if (payment.status === 'pending') {
          totalDue += payment.balanceAmount;
        } else if (payment.status === 'partial') {
          totalDue += payment.balanceAmount;
          totalPaid += payment.collectedAmount;
        } else if (payment.status === 'completed') {
          totalPaid += payment.collectedAmount;
        }
      } else {
        // No payment record yet, use shift fee
        totalAssigned += shiftFee;
        totalDue += shiftFee;
      }
    });

    return {
      ...student.toObject(),
      paymentSummary: {
        totalAssigned,
        totalDue,
        totalPaid,
        balance: totalDue
      },
      // Add individual assignment payment details for frontend
      currentAssignments: propertyAssignments.map(assignment => {
        const payment = assignment.payment;
        const shiftFee = assignment.shift?.fee || 0;
        
        let feeDetails = {
          amount: shiftFee,
          collected: 0,
          balance: shiftFee
        };

        if (payment) {
          feeDetails = {
            amount: payment.amount,
            collected: payment.collectedAmount,
            balance: payment.balanceAmount,
            status: payment.status
          };
        }

        return {
          ...assignment.toObject(),
          feeDetails
        };
      })
    };
  });

  // Calculate overall payment summary
  const overallSummary = enhancedStudents.reduce((summary, student) => {
    return {
      totalAssigned: summary.totalAssigned + student.paymentSummary.totalAssigned,
      totalDue: summary.totalDue + student.paymentSummary.totalDue,
      totalCollected: summary.totalCollected + student.paymentSummary.totalPaid,
      totalBalance: summary.totalBalance + student.paymentSummary.balance
    };
  }, { totalAssigned: 0, totalDue: 0, totalCollected: 0, totalBalance: 0 });

  res.json({ 
    students: enhancedStudents,
    paymentSummary: {
      totalStudents: enhancedStudents.length,
      ...overallSummary
    }
  });
});
// Enhanced getStudentById with detailed payment history
const getStudentById = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id)
    .populate({
      path: 'currentAssignments.seat',
      populate: {
        path: 'propertyId',
        select: 'name address'
      }
    })
    .populate({
      path: 'currentAssignments.shift'
    })
    .populate({
      path: 'currentAssignments.payment'
    })
    .populate({
      path: 'assignmentHistory.seat',
      populate: {
        path: 'propertyId',
        select: 'name address'
      }
    })
    .populate({
      path: 'assignmentHistory.shift'
    })
    .populate({
      path: 'assignmentHistory.payment'
    });

  if (!student) throw new ApiError(404, 'Student not found');

  // Get all payments for this student using new fields
  const allPayments = await Payment.find({ student: req.params.id })
    .populate('seat', 'seatNumber')
    .populate('shift', 'name')
    .populate('property', 'name')
    .sort('-paymentDate');

  // Calculate payment statistics using new fields
  const paymentStats = {
    totalPayments: allPayments.length,
    completedPayments: allPayments.filter(p => p.status === 'completed').length,
    pendingPayments: allPayments.filter(p => p.status === 'pending').length,
    partialPayments: allPayments.filter(p => p.status === 'partial').length,
    totalAmount: allPayments.reduce((sum, p) => sum + p.amount, 0),
    collectedAmount: allPayments.reduce((sum, p) => sum + p.collectedAmount, 0), // Use new field
    balanceAmount: allPayments.reduce((sum, p) => sum + p.balanceAmount, 0), // Use new field
    overduePayments: allPayments.filter(p => 
      p.status === 'pending' && p.dueDate && new Date() > new Date(p.dueDate)
    ).length
  };

  // Transform payments for frontend
  const transformedPayments = allPayments.map(payment => ({
    id: payment._id.toString(),
    amount: payment.amount,
    collectedAmount: payment.collectedAmount, // Use new field
    balanceAmount: payment.balanceAmount, // Use new field
    status: payment.status,
    paymentMethod: payment.paymentMethod,
    paymentDate: payment.paymentDate,
    dueDate: payment.dueDate,
    transactionId: payment.transactionId,
    description: payment.description,
    seatNumber: payment.seat?.seatNumber || 'N/A',
    shiftName: payment.shift?.name || 'N/A',
    propertyName: payment.property?.name || 'N/A',
    period: payment.period,
    isOverdue: payment.status === 'pending' && payment.dueDate && new Date() > new Date(payment.dueDate)
  }));

  res.json({
    ...student.toObject(),
    paymentHistory: transformedPayments,
    paymentStats
  });
});

// Enhanced getStudentStatsByProperty with payment statistics
const getStudentStatsByProperty = asyncHandler(async (req, res) => {
  const { propertyId } = req.query;
  if (!propertyId) throw new ApiError(400, 'Property ID is required');

  const students = await Student.find({ status: 'active' })
    .populate({
      path: 'currentAssignments.seat',
      match: { propertyId }
    })
    .populate({
      path: 'currentAssignments.payment'
    });

  const filtered = students.filter(student => 
    student.currentAssignments.some(assignment => 
      assignment.seat && assignment.seat.propertyId.toString() === propertyId
    )
  );

  // Calculate payment-related statistics using new fields
  const totalDue = filtered.reduce((sum, student) => {
    return sum + student.currentAssignments.reduce((assignmentSum, assignment) => {
      if (assignment.seat && assignment.seat.propertyId.toString() === propertyId) {
        if (assignment.payment && assignment.payment.status === 'pending') {
          return assignmentSum + assignment.payment.balanceAmount;
        }
      }
      return assignmentSum;
    }, 0);
  }, 0);

  const totalCollected = filtered.reduce((sum, student) => {
    return sum + student.currentAssignments.reduce((assignmentSum, assignment) => {
      if (assignment.seat && assignment.seat.propertyId.toString() === propertyId) {
        if (assignment.payment && (assignment.payment.status === 'completed' || assignment.payment.status === 'partial')) {
          return assignmentSum + assignment.payment.collectedAmount; // Use new field
        }
      }
      return assignmentSum;
    }, 0);
  }, 0);

  const totalAssignedAmount = filtered.reduce((sum, student) => {
    return sum + student.currentAssignments.reduce((assignmentSum, assignment) => {
      if (assignment.seat && assignment.seat.propertyId.toString() === propertyId) {
        return assignmentSum + (assignment.payment?.amount || 0);
      }
      return assignmentSum;
    }, 0);
  }, 0);

  const stats = {
    totalStudents: filtered.length,
    activeStudents: filtered.filter(s => s.status === 'active').length,
    studentsWithAssignments: filtered.filter(s => 
      s.currentAssignments.some(a => a.seat && a.seat.propertyId.toString() === propertyId)
    ).length,
    studentsWithPendingPayments: filtered.filter(s => 
      s.currentAssignments.some(a => 
        a.seat && a.seat.propertyId.toString() === propertyId && 
        a.payment && a.payment.status === 'pending'
      )
    ).length,
    studentsWithOverduePayments: filtered.filter(s => 
      s.currentAssignments.some(a => 
        a.seat && a.seat.propertyId.toString() === propertyId && 
        a.payment && a.payment.status === 'pending' && 
        a.payment.dueDate && new Date() > new Date(a.payment.dueDate)
      )
    ).length,
    paymentSummary: {
      totalAssignedAmount,
      totalDue,
      totalCollected,
      outstandingBalance: totalDue,
      collectionRate: totalAssignedAmount > 0 ? (totalCollected / totalAssignedAmount) * 100 : 0
    }
  };

  res.json(stats);
});

// Enhanced getStudentCurrentAssignments with payment details
const getStudentCurrentAssignments = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id)
    .populate('currentAssignments.seat')
    .populate('currentAssignments.shift')
    .populate('currentAssignments.payment');

  if (!student) throw new ApiError(404, 'Student not found');

  // Enhance assignments with payment status using new fields
  const enhancedAssignments = student.currentAssignments.map(assignment => {
    const payment = assignment.payment;
    const paymentStatus = payment ? payment.status : 'no_payment';
    const amountDue = payment ? payment.amount : (assignment.feeDetails?.amount || 0);
    const amountPaid = payment ? payment.collectedAmount : (assignment.feeDetails?.collected || 0); // Use new field
    const balanceDue = payment ? payment.balanceAmount : (assignment.feeDetails?.balance || amountDue); // Use new field
    const isOverdue = payment && 
                     payment.status === 'pending' && 
                     payment.dueDate && 
                     new Date() > new Date(payment.dueDate);

    return {
      ...assignment.toObject(),
      paymentSummary: {
        status: paymentStatus,
        amountDue,
        amountPaid,
        balanceDue,
        isOverdue,
        dueDate: payment?.dueDate || null,
        paymentDate: payment?.paymentDate || null,
        transactionId: payment?.transactionId || null
      }
    };
  });

  res.json({
    success: true,
    data: enhancedAssignments,
    summary: {
      totalAssignments: enhancedAssignments.length,
      totalDue: enhancedAssignments.reduce((sum, a) => sum + a.paymentSummary.amountDue, 0),
      totalPaid: enhancedAssignments.reduce((sum, a) => sum + a.paymentSummary.amountPaid, 0),
      totalBalance: enhancedAssignments.reduce((sum, a) => sum + a.paymentSummary.balanceDue, 0),
      overdueAssignments: enhancedAssignments.filter(a => a.paymentSummary.isOverdue).length,
      completedPayments: enhancedAssignments.filter(a => a.paymentSummary.status === 'completed').length,
      pendingPayments: enhancedAssignments.filter(a => a.paymentSummary.status === 'pending').length
    }
  });
});

// Enhanced getStudentAssignmentHistory with payment details
const getStudentAssignmentHistory = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id)
    .populate('assignmentHistory.seat')
    .populate('assignmentHistory.shift')
    .populate('assignmentHistory.payment');

  if (!student) throw new ApiError(404, 'Student not found');

  // Enhance assignment history with payment information using new fields
  const enhancedHistory = student.assignmentHistory.map(assignment => {
    const payment = assignment.payment;
    const amountDue = payment ? payment.amount : (assignment.feeDetails?.amount || 0);
    const amountPaid = payment ? payment.collectedAmount : (assignment.feeDetails?.collected || 0); // Use new field
    const balanceDue = payment ? payment.balanceAmount : (assignment.feeDetails?.balance || amountDue); // Use new field

    return {
      ...assignment.toObject(),
      paymentSummary: {
        status: payment ? payment.status : 'no_payment',
        amountDue,
        amountPaid,
        balanceDue,
        paymentDate: payment?.paymentDate || null,
        transactionId: payment?.transactionId || null
      }
    };
  });

  res.json({
    success: true,
    data: enhancedHistory,
    summary: {
      totalAssignments: enhancedHistory.length,
      totalRevenue: enhancedHistory.reduce((sum, a) => sum + a.paymentSummary.amountPaid, 0),
      averagePayment: enhancedHistory.length > 0 ? 
        enhancedHistory.reduce((sum, a) => sum + a.paymentSummary.amountPaid, 0) / enhancedHistory.length : 0
    }
  });
});

// Keep other functions the same (they don't directly handle payment calculations)
const createStudent = asyncHandler(async (req, res) => {
  try {
    console.log('=== CREATE STUDENT REQUEST START ===');
    
    let studentData = {};
    
    // Check if the request contains files (FormData)
    if (req.files && Object.keys(req.files).length > 0) {
      console.log('Processing FormData request');
      
      // If it's FormData, parse the text fields from req.body
      studentData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName || '',
        email: req.body.email,
        phone: req.body.phone,
        institution: req.body.institution || '',
        course: req.body.course || '',
        aadharNumber: req.body.aadharNumber || '',
        status: 'active',
        documents: req.files.map(file => {
          return {
            type: file.fieldname === 'profilePhoto' ? 'profile_photo' : 
                  file.fieldname === 'identityProof' ? 'identity_proof' : 'other',
            url: `/uploads/${file.filename}`,
            originalName: file.originalname
          };
        })
      };
    } else {
      console.log('Processing JSON request');
      // If it's JSON data, use req.body directly
      studentData = {
        ...req.body,
        status: req.body.status || 'active',
        documents: []
      };
    }

    console.log('Processed studentData:', studentData);

    // Validate required fields
    if (!studentData.firstName) {
      throw new ApiError(400, 'First name is required');
    }
    if (!studentData.email) {
      throw new ApiError(400, 'Email is required');
    }
    if (!studentData.phone) {
      throw new ApiError(400, 'Phone is required');
    }

    // Check if student with same email already exists
    const existingStudent = await Student.findOne({ email: studentData.email });
    if (existingStudent) {
      throw new ApiError(400, 'Student with this email already exists');
    }

    console.log('Creating new student in database...');
    const student = new Student(studentData);
    await student.save();
    
    const populatedStudent = await Student.findById(student._id)
      .populate('currentAssignments.seat')
      .populate('currentAssignments.shift')
      .populate('currentAssignments.payment');

    console.log('=== CREATE STUDENT REQUEST END ===');

    res.status(201).json({
      success: true,
      data: populatedStudent,
      message: 'Student created successfully. Assign seats to generate payment records.'
    });

  } catch (error) {
    console.error('Create student error:', error);
    if (error.code === 11000) {
      throw new ApiError(400, 'Student with this email already exists');
    }
    throw error;
  }
});

const updateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findByIdAndUpdate(
    req.params.id, 
    req.body, 
    { new: true, runValidators: true }
  )
  .populate('currentAssignments.seat')
  .populate('currentAssignments.shift')
  .populate('currentAssignments.payment');

  if (!student) throw new ApiError(404, 'Student not found');
  res.json(student);
});

const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  
  if (!student) throw new ApiError(404, 'Student not found');

  // Check if student has active assignments
  const activeAssignments = student.currentAssignments.filter(a => a.status === 'active');
  if (activeAssignments.length > 0) {
    throw new ApiError(400, 'Cannot delete student with active assignments');
  }

  await Student.findByIdAndDelete(req.params.id);
  res.json({ 
    success: true,
    message: 'Student deleted successfully' 
  });
});

const searchStudentsForAssignment = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  const { search = '' } = req.query;
  
  if (!propertyId) throw new ApiError(400, 'Property ID is required');

  // Build search query - remove any property-based filtering
  const searchQuery = {
    status: 'active'
  };

  // Only add search conditions if search term is provided
  if (search.trim()) {
    searchQuery.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  const students = await Student.find(searchQuery)
    .populate({
      path: 'currentAssignments.seat',
      select: 'seatNumber row column propertyId'
    })
    .populate({
      path: 'currentAssignments.shift',
      select: 'name startTime endTime fee'
    })
    .populate({
      path: 'currentAssignments.payment',
      select: 'amount collectedAmount balanceAmount status paymentDate transactionId'
    })
    .sort({ firstName: 1, lastName: 1 })
    .limit(50);

  // Return the same structure as getStudentsByProperty
  res.json({ 
    students: students,
    count: students.length 
  });
});

module.exports = {
  getStudentsByProperty,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentStatsByProperty,
  getStudentAssignmentHistory,
  getStudentCurrentAssignments,
  searchStudentsForAssignment
};