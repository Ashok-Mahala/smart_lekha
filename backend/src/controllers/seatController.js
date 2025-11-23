const Seat = require('../models/Seat');
const Student = require('../models/Student');
const Payment = require('../models/Payment');
const Shift = require('../models/Shift');
const ApiError = require('../utils/ApiError');
const { asyncHandler } = require('../utils/asyncHandler');
const mongoose = require('mongoose');

// Helper function to get payment details for assignments
const getPaymentDetailsForAssignments = async (assignments) => {
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
          paymentDate: payment.paymentDate || null
        };
      }
    });

    return paymentMap;
  } catch (error) {
    console.error('Error fetching payment details:', error);
    return {};
  }
};

// Helper functions for payment data
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

// Get seats by property with payment information
const getSeatsByProperty = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  const { status, type, shift } = req.query;
  
  const query = { propertyId };
  if (status) query.status = status;
  if (type) query.type = type;

  try {
    const seats = await Seat.find(query)
      .sort({ row: 1, column: 1 })
      .populate({
        path: 'currentAssignments.student',
        select: 'firstName lastName email phone'
      })
      .populate({
        path: 'currentAssignments.shift',
        select: 'name startTime endTime fee'
      })
      .populate({
        path: 'currentAssignments.createdBy',
        select: 'name email'
      });

    // Get payment details for all assignments
    const allAssignments = seats.flatMap(seat => seat.currentAssignments);
    const paymentMap = await getPaymentDetailsForAssignments(allAssignments);

    // Enhance assignments with payment information
    const enhancedSeats = seats.map(seat => {
      const seatObj = seat.toObject();
      
      seatObj.currentAssignments = seatObj.currentAssignments.map(assignment => {
        const paymentInfo = paymentMap[assignment._id.toString()] || {
          amount: assignment.shift?.fee || 0,
          collected: 0,
          balance: assignment.shift?.fee || 0,
          status: 'pending',
          dueDate: null,
          period: null,
          paymentMethod: 'PENDING',
          transactionId: null,
          paymentDate: null
        };
        
        return {
          ...assignment,
          feeDetails: paymentInfo
        };
      });
      
      return seatObj;
    });

    // Filter by shift if provided
    let filteredSeats = enhancedSeats;
    if (shift) {
      filteredSeats = enhancedSeats.filter(seat => 
        seat.currentAssignments.some(assignment => 
          assignment.shift && assignment.shift._id.toString() === shift
        )
      );
    }

    res.json({
      success: true,
      data: filteredSeats
    });
  } catch (error) {
    console.error('Error fetching seats:', error);
    throw new ApiError(500, 'Failed to fetch seat data');
  }
});

// Assign student to seat
const assignStudentToSeat = asyncHandler(async (req, res) => {
  try {
    const { seatId } = req.params;
    const { studentId, shiftId, startDate, documents, createdBy, feeDetails } = req.body;

    // Validate inputs
    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      throw new ApiError(400, 'Invalid student ID format');
    }

    const [seat, student, shift] = await Promise.all([
      Seat.findById(seatId),
      Student.findById(studentId),
      Shift.findById(shiftId)
    ]);

    if (!seat) throw new ApiError(404, 'Seat not found');
    if (!student) throw new ApiError(404, 'Student not found');
    if (!shift) throw new ApiError(404, 'Shift not found');

    // Check if seat is available for this shift
    if (!seat.isAvailableForShift(shiftId)) {
      throw new ApiError(400, 'Seat is not available for this shift');
    }

    // Check if student already has active assignment for this shift
    const existingAssignment = student.currentAssignments.find(
      assignment => assignment.shift && assignment.shift.toString() === shiftId && assignment.status === 'active'
    );
    if (existingAssignment) {
      throw new ApiError(400, 'Student already has an active assignment for this shift');
    }

    const assignmentStartDate = startDate ? new Date(startDate) : new Date();
    
    // Use feeDetails from request or calculate from shift fee
    const amount = feeDetails?.amount || shift.fee;
    const collectedAmount = feeDetails?.collected || 0;
    
    const assignmentData = {
      startDate: assignmentStartDate,
      monthlyRent: amount,
      documents: documents || [],
      createdBy: createdBy || req.user?._id
    };

    let seatAssignment;
    let studentAssignment;

    try {
      // 1. Assign student to seat and get the assignment
      seatAssignment = await seat.assignStudent(studentId, shiftId, assignmentData);
      
      // 2. Create assignment in student record and get the assignment
      studentAssignment = await student.assignToSeat(seatId, shiftId, assignmentData);

      // 3. Create payment record linked to STUDENT assignment
      const periodEndDate = new Date(assignmentStartDate);
      periodEndDate.setDate(periodEndDate.getDate() + 30);
      
      // Determine payment status based on collected amount
      let paymentStatus = 'pending';
      if (collectedAmount === amount) {
        paymentStatus = 'completed';
      } else if (collectedAmount > 0 && collectedAmount < amount) {
        paymentStatus = 'partial';
      }

      const paymentData = {
        student: studentId,
        seat: seatId,
        shift: shiftId,
        property: seat.propertyId,
        assignment: studentAssignment._id,
        totalAmount: amount,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        period: {
          start: assignmentStartDate,
          end: periodEndDate
        },
        feeType: 'seat_rent',
        description: `Seat rent for ${student.firstName} ${student.lastName || ''} - ${shift.name} shift`,
        createdBy: createdBy || req.user?._id,
        notes: `Auto-generated payment for seat assignment`
      };

      const payment = await Payment.create(paymentData);

      // If there's collected amount, add it as first installment
      if (collectedAmount > 0) {
        await payment.addInstallment({
          amount: collectedAmount,
          paymentMethod: feeDetails?.paymentMethod || 'cash',
          paymentDate: new Date(),
          collectedBy: createdBy || req.user?._id,
          description: 'Initial payment for seat assignment',
          receiptNumber: `RCPT-${Date.now()}`
        });
      }

      // Fetch updated seat with populated data
      const updatedSeat = await Seat.findById(seatId)
        .populate({
          path: 'currentAssignments.student',
          select: 'firstName lastName email phone'
        })
        .populate({
          path: 'currentAssignments.shift',
          select: 'name startTime endTime fee'
        })
        .populate({
          path: 'currentAssignments.createdBy',
          select: 'name email'
        });

      res.status(200).json({
        success: true,
        message: 'Student assigned to seat successfully',
        data: {
          seat: updatedSeat,
          payment: payment,
          assignmentIds: {
            seatAssignment: seatAssignment._id,
            studentAssignment: studentAssignment._id
          }
        }
      });

    } catch (error) {
      console.error('Error during assignment process:', error);
      
      // Cleanup: If assignment was partially created, try to rollback
      try {
        if (seatAssignment) {
          await Seat.updateOne(
            { _id: seatId },
            { $pull: { currentAssignments: { _id: seatAssignment._id } } }
          );
        }
        if (studentAssignment) {
          await Student.updateOne(
            { _id: studentId },
            { $pull: { currentAssignments: { _id: studentAssignment._id } } }
          );
        }
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
      }
      
      throw error;
    }

  } catch (error) {
    console.error('Error in assignStudentToSeat:', error);
    throw error;
  }
});

// Release student from seat
const releaseStudentFromSeat = asyncHandler(async (req, res) => {
  const { seatId } = req.params;
  const { studentId, shiftId } = req.body;

  const [seat, student] = await Promise.all([
    Seat.findById(seatId),
    Student.findById(studentId)
  ]);

  if (!seat) throw new ApiError(404, 'Seat not found');
  if (!student) throw new ApiError(404, 'Student not found');

  // Find the seat assignment
  const seatAssignment = seat.currentAssignments.find(
    assignment => assignment.student.toString() === studentId && 
                 assignment.shift.toString() === shiftId && 
                 assignment.status === 'active'
  );

  if (!seatAssignment) {
    throw new ApiError(404, 'Active assignment not found in seat');
  }

  // Find the student assignment
  const studentAssignment = student.currentAssignments.find(
    assignment => assignment.seat.toString() === seatId && 
                 assignment.shift.toString() === shiftId && 
                 assignment.status === 'active'
  );

  try {
    // Release from both seat and student
    await seat.releaseStudent(studentId, shiftId);
    await student.releaseFromSeat(seatId, shiftId);

    // Update payment status if needed
    if (studentAssignment && studentAssignment._id) {
      await Payment.updateOne(
        { assignment: studentAssignment._id },
        { 
          $set: { 
            status: 'completed',
            notes: `Assignment completed - ${new Date().toISOString()}`
          }
        }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Student released from seat successfully'
    });

  } catch (error) {
    console.error('Error releasing student:', error);
    throw error;
  }
});

// Other controller functions
const bulkCreateSeats = asyncHandler(async (req, res) => {
  const { seats } = req.body;
  
  if (!Array.isArray(seats) || seats.length === 0) {
    throw new ApiError(400, 'Seats data is required');
  }

  const validatedSeats = seats.map(seat => ({
    ...seat,
    status: seat.status || 'available',
    type: seat.type || 'standard'
  }));

  const createdSeats = await Seat.insertMany(validatedSeats);
  res.status(201).json({
    success: true,
    data: createdSeats
  });
});

const reserveSeat = asyncHandler(async (req, res) => {
  const { studentId, until, shiftId } = req.body;
  const seat = await Seat.findById(req.params.id);

  if (!seat) {
    throw new ApiError(404, 'Seat not found');
  }

  if (seat.status !== 'available') {
    throw new ApiError(400, 'Seat is not available for reservation');
  }

  seat.status = 'reserved';
  seat.reservedUntil = new Date(until);
  seat.reservedFor = {
    student: studentId,
    shift: shiftId
  };

  await seat.save();
  res.json({
    success: true,
    data: seat
  });
});

const updateSeatStatus = asyncHandler(async (req, res) => {
  let { status } = req.body;
  
  if (status && typeof status === 'object' && status.status) {
    status = status.status;
  }
  
  const validStatuses = ['available', 'occupied', 'reserved', 'maintenance', 'deleted'];
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  const seat = await Seat.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );

  if (!seat) {
    throw new ApiError(404, 'Seat not found');
  }

  res.status(200).json({
    success: true,
    data: seat
  });
});

const deleteSeat = asyncHandler(async (req, res) => {
  const seat = await Seat.findById(req.params.id);

  if (!seat) {
    throw new ApiError(404, 'Seat not found');
  }

  const activeAssignments = seat.currentAssignments.filter(a => a.status === 'active');
  if (activeAssignments.length > 0) {
    throw new ApiError(400, 'Cannot delete seat with active assignments');
  }

  await seat.softDelete();
  res.json({ 
    success: true,
    message: 'Seat deleted successfully', 
    seatId: req.params.id 
  });
});

const bulkUpdateSeats = asyncHandler(async (req, res) => {
  if (!Array.isArray(req.body)) {
    throw new ApiError(400, 'Expected an array of updates');
  }

  const bulkOps = req.body.map(update => ({
    updateOne: {
      filter: { _id: update.id },
      update: { $set: update.updates }
    }
  }));

  const result = await Seat.bulkWrite(bulkOps);
  
  res.json({
    success: true,
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount
  });
});

const getSeatAssignmentHistory = asyncHandler(async (req, res) => {
  const { seatId } = req.params;
  
  const seat = await Seat.findById(seatId)
    .populate('assignmentHistory.student', 'firstName lastName email phone')
    .populate('assignmentHistory.shift', 'name startTime endTime fee')
    .populate('assignmentHistory.createdBy', 'name email');

  if (!seat) {
    throw new ApiError(404, 'Seat not found');
  }

  const paymentMap = await getPaymentDetailsForAssignments(seat.assignmentHistory);

  const enhancedHistory = seat.assignmentHistory.map(assignment => {
    const paymentInfo = paymentMap[assignment._id.toString()] || {
      amount: assignment.shift?.fee || 0,
      collected: assignment.shift?.fee || 0,
      balance: 0,
      status: 'completed',
      dueDate: null,
      period: null,
      paymentMethod: 'CASH',
      transactionId: null,
      paymentDate: null
    };

    return {
      ...assignment.toObject(),
      feeDetails: paymentInfo
    };
  });

  res.json({
    success: true,
    data: enhancedHistory
  });
});

const deassignStudent = asyncHandler(async (req, res) => {
  const { seatId } = req.params;
  const { studentId, shiftId, reason } = req.body;

  const [seat, student] = await Promise.all([
    Seat.findById(seatId),
    Student.findById(studentId)
  ]);

  if (!seat) throw new ApiError(404, 'Seat not found');
  if (!student) throw new ApiError(404, 'Student not found');

  await seat.releaseStudent(studentId, shiftId);
  await student.releaseFromSeat(seatId, shiftId);

  if (reason) {
    console.log(`Student ${studentId} deassigned from seat ${seatId}. Reason: ${reason}`);
  }

  res.status(200).json({
    success: true,
    message: 'Student deassigned successfully'
  });
});

// Change student seat
const changeStudentSeat = asyncHandler(async (req, res) => {
  const { currentSeatId, newSeatId, studentId, shiftId, reason } = req.body;

  if (!currentSeatId || !newSeatId || !studentId || !shiftId) {
    throw new ApiError(400, 'currentSeatId, newSeatId, studentId, and shiftId are required');
  }

  if (currentSeatId === newSeatId) {
    throw new ApiError(400, 'New seat cannot be the same as current seat');
  }

  const [currentSeat, newSeat, student, shift] = await Promise.all([
    Seat.findById(currentSeatId),
    Seat.findById(newSeatId),
    Student.findById(studentId),
    Shift.findById(shiftId)
  ]);

  if (!currentSeat) throw new ApiError(404, 'Current seat not found');
  if (!newSeat) throw new ApiError(404, 'New seat not found');
  if (!student) throw new ApiError(404, 'Student not found');
  if (!shift) throw new ApiError(404, 'Shift not found');

  // Verify student is assigned to current seat
  const currentAssignment = currentSeat.currentAssignments.find(
    assignment => assignment.student.toString() === studentId && 
                 assignment.shift.toString() === shiftId && 
                 assignment.status === 'active'
  );

  if (!currentAssignment) {
    throw new ApiError(400, 'Student is not assigned to the current seat for this shift');
  }

  if (!newSeat.isAvailableForShift(shiftId)) {
    throw new ApiError(400, 'New seat is not available for this shift');
  }

  // Find student assignment
  const studentAssignment = student.currentAssignments.find(
    assignment => assignment.seat.toString() === currentSeatId && 
                 assignment.shift.toString() === shiftId && 
                 assignment.status === 'active'
  );

  // Release from current seat and assign to new seat
  await currentSeat.releaseStudent(studentId, shiftId);
  
  const assignmentData = {
    startDate: new Date(),
    documents: currentAssignment.documents || [],
    createdBy: currentAssignment.createdBy || req.user?._id,
    reason: reason || 'Seat change'
  };

  await newSeat.assignStudent(studentId, shiftId, assignmentData);
  await student.releaseFromSeat(currentSeatId, shiftId);
  await student.assignToSeat(newSeatId, shiftId, assignmentData);

  // Update payment with new seat
  if (studentAssignment && studentAssignment._id) {
    await Payment.updateOne(
      { assignment: studentAssignment._id },
      {
        $set: {
          seat: newSeatId,
          notes: `Seat changed from ${currentSeat.seatNumber} to ${newSeat.seatNumber}. Reason: ${reason || 'No reason provided'}`
        }
      }
    );
  }

  // Fetch updated data
  const [updatedCurrentSeat, updatedNewSeat] = await Promise.all([
    Seat.findById(currentSeatId)
      .populate('currentAssignments.student')
      .populate('currentAssignments.shift')
      .populate('currentAssignments.createdBy'),
    Seat.findById(newSeatId)
      .populate('currentAssignments.student')
      .populate('currentAssignments.shift')
      .populate('currentAssignments.createdBy')
  ]);

  res.status(200).json({
    success: true,
    message: 'Seat changed successfully',
    data: {
      previousSeat: updatedCurrentSeat,
      newSeat: updatedNewSeat
    }
  });
});

module.exports = {
  getSeatsByProperty,
  assignStudentToSeat,
  releaseStudentFromSeat,
  bulkCreateSeats,
  reserveSeat,
  updateSeatStatus,
  deleteSeat,
  bulkUpdateSeats,
  getSeatAssignmentHistory,
  deassignStudent,
  changeStudentSeat
};