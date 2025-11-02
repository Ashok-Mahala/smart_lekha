// controllers/studentController.js - Enhanced with Payment Integration
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
      select: 'amount status paymentDate transactionId dueDate'
    })
    .sort({ createdAt: -1 });

  // Filter students with assignments in this property
  const filteredStudents = students.filter(student => 
    student.currentAssignments.some(assignment => 
      assignment.seat && assignment.seat.propertyId.toString() === propertyId
    )
  );

  // Enhance response with payment summary
  const enhancedStudents = filteredStudents.map(student => {
    const totalDue = student.currentAssignments.reduce((sum, assignment) => {
      if (assignment.payment && assignment.payment.status === 'pending') {
        return sum + (assignment.feeDetails?.balance || assignment.payment.amount);
      }
      return sum;
    }, 0);

    const totalPaid = student.currentAssignments.reduce((sum, assignment) => {
      if (assignment.payment && (assignment.payment.status === 'completed' || assignment.payment.status === 'partial')) {
        return sum + (assignment.feeDetails?.collected || 0);
      }
      return sum;
    }, 0);

    return {
      ...student.toObject(),
      paymentSummary: {
        totalDue,
        totalPaid,
        balance: totalDue
      }
    };
  });

  res.json({ 
    students: enhancedStudents,
    paymentSummary: {
      totalStudents: enhancedStudents.length,
      totalDue: enhancedStudents.reduce((sum, student) => sum + student.paymentSummary.totalDue, 0),
      totalCollected: enhancedStudents.reduce((sum, student) => sum + student.paymentSummary.totalPaid, 0)
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

  // Get all payments for this student
  const allPayments = await Payment.find({ student: req.params.id })
    .populate('seat', 'seatNumber')
    .populate('shift', 'name')
    .sort('-paymentDate');

  // Calculate payment statistics
  const paymentStats = {
    totalPayments: allPayments.length,
    completedPayments: allPayments.filter(p => p.status === 'completed').length,
    pendingPayments: allPayments.filter(p => p.status === 'pending').length,
    totalAmount: allPayments.reduce((sum, p) => sum + p.amount, 0),
    collectedAmount: allPayments
      .filter(p => p.status === 'completed' || p.status === 'partial')
      .reduce((sum, p) => sum + p.paymentBreakdown.reduce((breakdownSum, b) => breakdownSum + b.amount, 0), 0)
  };

  res.json({
    ...student.toObject(),
    paymentHistory: allPayments,
    paymentStats
  });
});

// Enhanced getStudentStatsByProperty with payment statistics
const getStudentStatsByProperty = asyncHandler(async (req, res) => {
  const { propertyId } = req.query;
  if (!propertyId) throw new ApiError(400, 'Property ID is required');

  const students = await Student.find({ status: 'active' })
    .populate('currentAssignments.seat')
    .populate('currentAssignments.payment');

  const filtered = students.filter(student => 
    student.currentAssignments.some(assignment => 
      assignment.seat && assignment.seat.propertyId.toString() === propertyId
    )
  );

  // Calculate payment-related statistics
  const totalDue = filtered.reduce((sum, student) => {
    return sum + student.currentAssignments.reduce((assignmentSum, assignment) => {
      if (assignment.payment && assignment.payment.status === 'pending') {
        return assignmentSum + assignment.payment.amount;
      }
      return assignmentSum;
    }, 0);
  }, 0);

  const totalCollected = filtered.reduce((sum, student) => {
    return sum + student.currentAssignments.reduce((assignmentSum, assignment) => {
      if (assignment.payment && (assignment.payment.status === 'completed' || assignment.payment.status === 'partial')) {
        return assignmentSum + assignment.payment.paymentBreakdown.reduce(
          (breakdownSum, breakdown) => breakdownSum + breakdown.amount, 0
        );
      }
      return assignmentSum;
    }, 0);
  }, 0);

  const stats = {
    totalStudents: filtered.length,
    activeStudents: filtered.filter(s => s.status === 'active').length,
    studentsWithAssignments: filtered.filter(s => s.currentAssignments.length > 0).length,
    studentsWithPendingPayments: filtered.filter(s => 
      s.currentAssignments.some(a => a.payment && a.payment.status === 'pending')
    ).length,
    paymentSummary: {
      totalDue,
      totalCollected,
      outstandingBalance: totalDue - totalCollected
    }
  };

  res.json(stats);
});

// Keep other functions the same as they don't directly create payments
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

// Enhanced getStudentCurrentAssignments with payment details
const getStudentCurrentAssignments = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id)
    .populate('currentAssignments.seat')
    .populate('currentAssignments.shift')
    .populate('currentAssignments.payment');

  if (!student) throw new ApiError(404, 'Student not found');

  // Enhance assignments with payment status
  const enhancedAssignments = student.currentAssignments.map(assignment => {
    const paymentStatus = assignment.payment ? assignment.payment.status : 'no_payment';
    const amountDue = assignment.feeDetails?.amount || (assignment.payment ? assignment.payment.amount : 0);
    const amountPaid = assignment.feeDetails?.collected || 0;
    const balanceDue = amountDue - amountPaid;

    return {
      ...assignment.toObject(),
      paymentSummary: {
        status: paymentStatus,
        amountDue,
        amountPaid,
        balanceDue,
        isOverdue: assignment.payment && 
                   assignment.payment.dueDate && 
                   new Date() > new Date(assignment.payment.dueDate) &&
                   paymentStatus === 'pending'
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
      overdueAssignments: enhancedAssignments.filter(a => a.paymentSummary.isOverdue).length
    }
  });
});

// Keep other functions the same
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

const getStudentAssignmentHistory = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id)
    .populate('assignmentHistory.seat')
    .populate('assignmentHistory.shift')
    .populate('assignmentHistory.payment');

  if (!student) throw new ApiError(404, 'Student not found');

  res.json({
    success: true,
    data: student.assignmentHistory
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
      select: 'amount status paymentDate transactionId'
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