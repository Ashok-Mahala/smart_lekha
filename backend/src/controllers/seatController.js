const Seat = require('../models/Seat');
const Student = require('../models/Student');
const Payment = require('../models/Payment');
const Shift = require('../models/Shift');
const ApiError = require('../utils/ApiError');
const { asyncHandler } = require('../utils/asyncHandler');
const mongoose = require('mongoose');

// NEW: Helper function to find student assignments that match seat assignments
const findMatchingStudentAssignments = async (seatAssignments) => {
  if (!seatAssignments || seatAssignments.length === 0) {
    return {};
  }

  try {
    // Extract unique student-shift combinations from seat assignments
    const studentShiftCombinations = [];
    const seatAssignmentMap = {};
    
    seatAssignments.forEach(seatAssignment => {
      const studentId = seatAssignment.student?._id || seatAssignment.student;
      const shiftId = seatAssignment.shift?._id || seatAssignment.shift;
      
      if (studentId && shiftId) {
        const key = `${studentId.toString()}_${shiftId.toString()}`;
        studentShiftCombinations.push({ studentId, shiftId });
        if (!seatAssignmentMap[key]) {
          seatAssignmentMap[key] = [];
        }
        seatAssignmentMap[key].push(seatAssignment);
      }
    });

    // Find matching student assignments
    const studentAssignments = await Student.aggregate([
      { $match: { 
        '_id': { $in: [...new Set(studentShiftCombinations.map(c => new mongoose.Types.ObjectId(c.studentId)))] }
      }},
      { $unwind: '$currentAssignments' },
      { $match: {
        'currentAssignments.status': 'active',
        'currentAssignments.shift': { $in: [...new Set(studentShiftCombinations.map(c => new mongoose.Types.ObjectId(c.shiftId)))] }
      }},
      { $project: {
        studentId: '$_id',
        assignmentId: '$currentAssignments._id',
        shiftId: '$currentAssignments.shift',
        seatId: '$currentAssignments.seat'
      }}
    ]);

    // Create mapping from seat assignment to student assignment ID
    const assignmentMapping = {};
    
    studentAssignments.forEach(sa => {
      const key = `${sa.studentId.toString()}_${sa.shiftId.toString()}`;
      if (seatAssignmentMap[key]) {
        seatAssignmentMap[key].forEach(seatAssignment => {
          assignmentMapping[seatAssignment._id.toString()] = sa.assignmentId;
        });
      }
    });

    return assignmentMapping;
  } catch (error) {
    console.error('Error finding matching student assignments:', error);
    return {};
  }
};

// UPDATED: Helper function to get payment details for assignments
const getPaymentDetailsForAssignments = async (assignments) => {
  if (!assignments || assignments.length === 0) {
    return {};
  }

  try {
    // Step 1: Find matching student assignment IDs for seat assignments
    const assignmentMapping = await findMatchingStudentAssignments(assignments);
    
    // Step 2: Get all student assignment IDs that we found
    const studentAssignmentIds = Object.values(assignmentMapping);
    
    if (studentAssignmentIds.length === 0) {
      console.log('No matching student assignments found for seat assignments');
      return {};
    }

    // Step 3: Find payments for these student assignments
    const payments = await Payment.find({
      assignment: { $in: studentAssignmentIds }
    })
    .select('assignment amount collectedAmount balanceAmount status dueDate period paymentMethod transactionId paymentDate')
    .lean();

    // Step 4: Create payment map keyed by student assignment ID
    const paymentMapByStudentAssignment = {};
    
    payments.forEach(payment => {
      if (payment.assignment) {
        paymentMapByStudentAssignment[payment.assignment.toString()] = {
          amount: payment.amount || 0,
          collected: payment.collectedAmount || 0,
          balance: payment.balanceAmount || 0,
          status: payment.status || 'pending',
          dueDate: payment.dueDate || null,
          period: payment.period || null,
          paymentMethod: payment.paymentMethod || 'pending',
          transactionId: payment.transactionId || null,
          paymentDate: payment.paymentDate || null
        };
      }
    });

    // Step 5: Map payments back to seat assignments using our mapping
    const paymentMapForSeatAssignments = {};
    
    assignments.forEach(assignment => {
      const assignmentId = assignment._id.toString();
      const studentAssignmentId = assignmentMapping[assignmentId];
      
      if (studentAssignmentId && paymentMapByStudentAssignment[studentAssignmentId.toString()]) {
        // Found payment for this seat assignment via student assignment
        paymentMapForSeatAssignments[assignmentId] = paymentMapByStudentAssignment[studentAssignmentId.toString()];
      } else {
        // No payment found, create default info
        const shiftFee = assignment.shift?.fee || 0;
        paymentMapForSeatAssignments[assignmentId] = {
          amount: shiftFee,
          collected: 0,
          balance: shiftFee,
          status: 'pending',
          dueDate: null,
          period: null,
          paymentMethod: 'pending',
          transactionId: null,
          paymentDate: null
        };
      }
    });

    return paymentMapForSeatAssignments;
  } catch (error) {
    console.error('Error fetching payment details:', error);
    return {};
  }
};

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
          amount: 0,
          collected: 0,
          balance: 0,
          status: 'pending',
          dueDate: null,
          period: null,
          paymentMethod: 'pending',
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

    console.log('=== ASSIGN STUDENT TO SEAT START ===');

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
    const balanceAmount = feeDetails?.balance || (amount - collectedAmount);
    
    const assignmentData = {
      startDate: assignmentStartDate,
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

      console.log('Seat Assignment ID:', seatAssignment._id);
      console.log('Student Assignment ID:', studentAssignment._id);

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

      // Set payment date if amount is collected
      const paymentDate = collectedAmount > 0 ? new Date() : null;

      const paymentData = {
        student: studentId,
        seat: seatId,
        shift: shiftId,
        property: seat.propertyId,
        assignment: studentAssignment._id, // Link to STUDENT assignment
        amount: amount,
        collectedAmount: collectedAmount,
        balanceAmount: balanceAmount,
        status: paymentStatus,
        paymentMethod: collectedAmount > 0 ? (feeDetails?.paymentMethod || 'cash') : 'pending',
        transactionId: collectedAmount > 0 ? `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}` : null,
        paymentDate: paymentDate,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        period: {
          start: assignmentStartDate,
          end: periodEndDate
        },
        feeType: 'seat_rent',
        description: `Seat rent for ${student.firstName} ${student.lastName || ''} - ${shift.name} shift`,
        paymentBreakdown: [
          {
            description: 'Seat Rent',
            amount: amount,
            type: 'base_fee'
          }
        ],
        createdBy: createdBy || req.user?._id,
        notes: `Auto-generated payment for seat assignment`
      };

      // If there's collected amount, add it to payment breakdown
      if (collectedAmount > 0) {
        paymentData.paymentBreakdown.push({
          description: 'Initial Payment',
          amount: collectedAmount,
          type: 'base_fee',
          date: new Date()
        });
      }

      const payment = await Payment.create(paymentData);

      console.log('=== ASSIGN STUDENT TO SEAT END - SUCCESS ===');
      console.log('Payment created with ID:', payment._id);
      console.log('Linked to student assignment:', studentAssignment._id);

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

// Other controller functions (simplified for brevity)
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
      amount: 0,
      collected: 0,
      balance: 0,
      status: 'unknown',
      dueDate: null,
      period: null,
      paymentMethod: 'pending',
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

// Change student seat (simplified for brevity)
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