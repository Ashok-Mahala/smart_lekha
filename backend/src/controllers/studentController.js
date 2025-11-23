const Student = require('../models/Student');
const Seat = require('../models/Seat');
const Shift = require('../models/Shift');
const Payment = require('../models/Payment');
const ApiError = require('../utils/ApiError');
const { asyncHandler } = require('../utils/asyncHandler');
const mongoose = require('mongoose');

// Helper function to get payment details for student assignments
const getPaymentDetailsForStudentAssignments = async (assignments) => {
  if (!assignments || assignments.length === 0) {
    return {};
  }

  const assignmentIds = assignments.map(assignment => assignment._id);
  
  try {
    const payments = await Payment.find({
      assignment: { $in: assignmentIds }
    })
    .select('assignment totalAmount totalCollected balanceAmount status dueDate period paymentMethod transactionId paymentDate installments')
    .lean();

    const paymentMap = {};
    
    payments.forEach(payment => {
      if (payment.assignment) {
        paymentMap[payment.assignment.toString()] = {
          amount: payment.totalAmount || 0,
          collected: payment.totalCollected || 0,
          balance: payment.balanceAmount || 0,
          status: payment.status || 'pending',
          dueDate: payment.dueDate || null,
          period: payment.period || null,
          paymentMethod: getLatestPaymentMethod(payment.installments),
          transactionId: getLatestTransactionId(payment.installments),
          paymentDate: payment.paymentDate || null,
          installments: payment.installments || []
        };
      }
    });

    return paymentMap;
  } catch (error) {
    console.error('Error fetching payment details for student assignments:', error);
    return {};
  }
};

// Helper functions for payment data transformation
function getLatestPaymentMethod(installments) {
  if (!installments || installments.length === 0) return 'PENDING';
  const latest = installments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))[0];
  const methodMap = {
    'cash': 'CASH',
    'online': 'UPI',
    'card': 'CARD',
    'bank_transfer': 'BANK_TRANSFER'
  };
  return methodMap[latest.paymentMethod] || 'CASH';
}

function getLatestTransactionId(installments) {
  if (!installments || installments.length === 0) return null;
  const latest = installments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))[0];
  return latest.transactionId;
}

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
    .sort({ createdAt: -1 });

  // Filter students with assignments in this property
  const filteredStudents = students.filter(student => 
    student.currentAssignments.some(assignment => 
      assignment.seat && assignment.seat.propertyId.toString() === propertyId
    )
  );

  // Get all assignments across all students for payment lookup
  const allAssignments = filteredStudents.flatMap(student => 
    student.currentAssignments.filter(assignment => 
      assignment.seat && assignment.seat.propertyId.toString() === propertyId
    )
  );

  // Get payment details for all assignments
  const paymentMap = await getPaymentDetailsForStudentAssignments(allAssignments);

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
      const paymentInfo = paymentMap[assignment._id.toString()];
      const shiftFee = assignment.shift?.fee || assignment.monthlyRent || 0;
      
      if (paymentInfo) {
        // Use payment data if available
        totalAssigned += paymentInfo.amount;
        
        if (paymentInfo.status === 'pending' || paymentInfo.status === 'overdue') {
          totalDue += paymentInfo.balance;
        } else if (paymentInfo.status === 'partial') {
          totalDue += paymentInfo.balance;
          totalPaid += paymentInfo.collected;
        } else if (paymentInfo.status === 'completed') {
          totalPaid += paymentInfo.collected;
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
        const paymentInfo = paymentMap[assignment._id.toString()];
        const shiftFee = assignment.shift?.fee || assignment.monthlyRent || 0;
        
        let feeDetails = {
          amount: shiftFee,
          collected: 0,
          balance: shiftFee,
          status: 'pending'
        };

        if (paymentInfo) {
          feeDetails = {
            amount: paymentInfo.amount,
            collected: paymentInfo.collected,
            balance: paymentInfo.balance,
            status: paymentInfo.status === 'overdue' ? 'pending' : paymentInfo.status,
            dueDate: paymentInfo.dueDate,
            period: paymentInfo.period,
            paymentMethod: paymentInfo.paymentMethod,
            transactionId: paymentInfo.transactionId,
            paymentDate: paymentInfo.paymentDate
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
      path: 'assignmentHistory.seat',
      populate: {
        path: 'propertyId',
        select: 'name address'
      }
    })
    .populate({
      path: 'assignmentHistory.shift'
    });

  if (!student) throw new ApiError(404, 'Student not found');

  // Get all assignments for payment lookup
  const allAssignments = [
    ...student.currentAssignments,
    ...student.assignmentHistory
  ];
  const paymentMap = await getPaymentDetailsForStudentAssignments(allAssignments);

  // Get all payments for this student
  const allPayments = await Payment.find({ student: req.params.id })
    .populate('seat', 'seatNumber')
    .populate('shift', 'name')
    .populate('property', 'name')
    .sort('-paymentDate');

  // Calculate payment statistics
  const paymentStats = {
    totalPayments: allPayments.length,
    completedPayments: allPayments.filter(p => p.status === 'completed').length,
    pendingPayments: allPayments.filter(p => p.status === 'pending' || p.status === 'overdue').length,
    partialPayments: allPayments.filter(p => p.status === 'partial').length,
    totalAmount: allPayments.reduce((sum, p) => sum + p.totalAmount, 0),
    collectedAmount: allPayments.reduce((sum, p) => sum + p.totalCollected, 0),
    balanceAmount: allPayments.reduce((sum, p) => sum + p.balanceAmount, 0),
    overduePayments: allPayments.filter(p => 
      (p.status === 'pending' || p.status === 'overdue') && p.dueDate && new Date() > new Date(p.dueDate)
    ).length
  };

  // Transform payments for frontend
  const transformedPayments = allPayments.map(payment => ({
    id: payment._id.toString(),
    amount: payment.totalAmount,
    collectedAmount: payment.totalCollected,
    balanceAmount: payment.balanceAmount,
    status: payment.status === 'overdue' ? 'pending' : payment.status,
    paymentMethod: getLatestPaymentMethod(payment.installments),
    paymentDate: payment.paymentDate,
    dueDate: payment.dueDate,
    transactionId: getLatestTransactionId(payment.installments),
    description: payment.description,
    seatNumber: payment.seat?.seatNumber || 'N/A',
    shiftName: payment.shift?.name || 'N/A',
    propertyName: payment.property?.name || 'N/A',
    period: payment.period,
    isOverdue: (payment.status === 'pending' || payment.status === 'overdue') && payment.dueDate && new Date() > new Date(payment.dueDate)
  }));

  // Enhance current assignments with payment info
  const enhancedCurrentAssignments = student.currentAssignments.map(assignment => {
    const paymentInfo = paymentMap[assignment._id.toString()];
    const shiftFee = assignment.shift?.fee || assignment.monthlyRent || 0;

    return {
      ...assignment.toObject(),
      feeDetails: paymentInfo ? {
        amount: paymentInfo.amount,
        collected: paymentInfo.collected,
        balance: paymentInfo.balance,
        status: paymentInfo.status === 'overdue' ? 'pending' : paymentInfo.status,
        dueDate: paymentInfo.dueDate,
        period: paymentInfo.period,
        paymentMethod: paymentInfo.paymentMethod,
        transactionId: paymentInfo.transactionId,
        paymentDate: paymentInfo.paymentDate
      } : {
        amount: shiftFee,
        collected: 0,
        balance: shiftFee,
        status: 'pending'
      }
    };
  });

  // Enhance assignment history with payment info
  const enhancedAssignmentHistory = student.assignmentHistory.map(assignment => {
    const paymentInfo = paymentMap[assignment._id.toString()];
    const shiftFee = assignment.shift?.fee || assignment.monthlyRent || 0;

    return {
      ...assignment.toObject(),
      feeDetails: paymentInfo ? {
        amount: paymentInfo.amount,
        collected: paymentInfo.collected,
        balance: paymentInfo.balance,
        status: paymentInfo.status === 'overdue' ? 'pending' : paymentInfo.status,
        dueDate: paymentInfo.dueDate,
        period: paymentInfo.period
      } : {
        amount: shiftFee,
        collected: shiftFee,
        balance: 0,
        status: 'completed'
      }
    };
  });

  res.json({
    ...student.toObject(),
    currentAssignments: enhancedCurrentAssignments,
    assignmentHistory: enhancedAssignmentHistory,
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
      path: 'currentAssignments.shift'
    });

  const filtered = students.filter(student => 
    student.currentAssignments.some(assignment => 
      assignment.seat && assignment.seat.propertyId.toString() === propertyId
    )
  );

  // Get all assignments for payment lookup
  const allAssignments = filtered.flatMap(student => 
    student.currentAssignments.filter(assignment => 
      assignment.seat && assignment.seat.propertyId.toString() === propertyId
    )
  );

  const paymentMap = await getPaymentDetailsForStudentAssignments(allAssignments);

  // Calculate payment-related statistics
  const totalDue = allAssignments.reduce((sum, assignment) => {
    const paymentInfo = paymentMap[assignment._id.toString()];
    if (paymentInfo && (paymentInfo.status === 'pending' || paymentInfo.status === 'overdue')) {
      return sum + paymentInfo.balance;
    }
    return sum;
  }, 0);

  const totalCollected = allAssignments.reduce((sum, assignment) => {
    const paymentInfo = paymentMap[assignment._id.toString()];
    if (paymentInfo && (paymentInfo.status === 'completed' || paymentInfo.status === 'partial')) {
      return sum + paymentInfo.collected;
    }
    return sum;
  }, 0);

  const totalAssignedAmount = allAssignments.reduce((sum, assignment) => {
    const paymentInfo = paymentMap[assignment._id.toString()];
    if (paymentInfo) {
      return sum + paymentInfo.amount;
    }
    // If no payment record, use shift fee
    return sum + (assignment.shift?.fee || assignment.monthlyRent || 0);
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
        paymentMap[a._id.toString()] && 
        (paymentMap[a._id.toString()].status === 'pending' || paymentMap[a._id.toString()].status === 'overdue')
      )
    ).length,
    studentsWithOverduePayments: filtered.filter(s => 
      s.currentAssignments.some(a => 
        a.seat && a.seat.propertyId.toString() === propertyId && 
        paymentMap[a._id.toString()] && 
        (paymentMap[a._id.toString()].status === 'pending' || paymentMap[a._id.toString()].status === 'overdue') && 
        paymentMap[a._id.toString()].dueDate && 
        new Date() > new Date(paymentMap[a._id.toString()].dueDate)
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
    .populate('currentAssignments.shift');

  if (!student) throw new ApiError(404, 'Student not found');

  // Get payment details for current assignments
  const paymentMap = await getPaymentDetailsForStudentAssignments(student.currentAssignments);

  // Enhance assignments with payment status
  const enhancedAssignments = student.currentAssignments.map(assignment => {
    const paymentInfo = paymentMap[assignment._id.toString()];
    const shiftFee = assignment.shift?.fee || assignment.monthlyRent || 0;
    
    const amountDue = paymentInfo ? paymentInfo.amount : shiftFee;
    const amountPaid = paymentInfo ? paymentInfo.collected : 0;
    const balanceDue = paymentInfo ? paymentInfo.balance : shiftFee;
    const paymentStatus = paymentInfo ? (paymentInfo.status === 'overdue' ? 'pending' : paymentInfo.status) : 'pending';
    const isOverdue = paymentInfo && 
                     (paymentInfo.status === 'pending' || paymentInfo.status === 'overdue') && 
                     paymentInfo.dueDate && 
                     new Date() > new Date(paymentInfo.dueDate);

    return {
      ...assignment.toObject(),
      paymentSummary: {
        status: paymentStatus,
        amountDue,
        amountPaid,
        balanceDue,
        isOverdue,
        dueDate: paymentInfo?.dueDate || null,
        paymentDate: paymentInfo?.paymentDate || null,
        transactionId: paymentInfo?.transactionId || null,
        paymentMethod: paymentInfo?.paymentMethod || null
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
    .populate('assignmentHistory.shift');

  if (!student) throw new ApiError(404, 'Student not found');

  // Get payment details for assignment history
  const paymentMap = await getPaymentDetailsForStudentAssignments(student.assignmentHistory);

  // Enhance assignment history with payment information
  const enhancedHistory = student.assignmentHistory.map(assignment => {
    const paymentInfo = paymentMap[assignment._id.toString()];
    const shiftFee = assignment.shift?.fee || assignment.monthlyRent || 0;
    
    const amountDue = paymentInfo ? paymentInfo.amount : shiftFee;
    const amountPaid = paymentInfo ? paymentInfo.collected : shiftFee;
    const balanceDue = paymentInfo ? paymentInfo.balance : 0;

    return {
      ...assignment.toObject(),
      paymentSummary: {
        status: paymentInfo ? (paymentInfo.status === 'overdue' ? 'pending' : paymentInfo.status) : 'completed',
        amountDue,
        amountPaid,
        balanceDue,
        paymentDate: paymentInfo?.paymentDate || assignment.endDate || null,
        transactionId: paymentInfo?.transactionId || null
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

// Keep other functions the same
const createStudent = asyncHandler(async (req, res) => {
  try {
    let studentData = {};
    
    // Check if the request contains files (FormData)
    if (req.files && Object.keys(req.files).length > 0) {
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
      studentData = {
        ...req.body,
        status: req.body.status || 'active',
        documents: []
      };
    }

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

    const student = new Student(studentData);
    await student.save();
    
    const populatedStudent = await Student.findById(student._id)
      .populate('currentAssignments.seat')
      .populate('currentAssignments.shift');

    res.status(201).json({
      success: true,
      data: populatedStudent,
      message: 'Student created successfully. Assign seats to generate payment records.'
    });

  } catch (error) {
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
  .populate('currentAssignments.shift');

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

  // Build search query
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
    .sort({ firstName: 1, lastName: 1 })
    .limit(50);

  // Get all assignments for payment lookup
  const allAssignments = students.flatMap(student => student.currentAssignments);
  const paymentMap = await getPaymentDetailsForStudentAssignments(allAssignments);

  // Enhance students with payment info
  const enhancedStudents = students.map(student => {
    const enhancedAssignments = student.currentAssignments.map(assignment => {
      const paymentInfo = paymentMap[assignment._id.toString()];
      const shiftFee = assignment.shift?.fee || assignment.monthlyRent || 0;

      return {
        ...assignment.toObject(),
        feeDetails: paymentInfo ? {
          amount: paymentInfo.amount,
          collected: paymentInfo.collected,
          balance: paymentInfo.balance,
          status: paymentInfo.status === 'overdue' ? 'pending' : paymentInfo.status
        } : {
          amount: shiftFee,
          collected: 0,
          balance: shiftFee,
          status: 'pending'
        }
      };
    });

    return {
      ...student.toObject(),
      currentAssignments: enhancedAssignments
    };
  });

  res.json({ 
    students: enhancedStudents,
    count: enhancedStudents.length 
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