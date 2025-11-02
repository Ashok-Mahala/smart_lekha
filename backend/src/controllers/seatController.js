// controllers/seatController.js - Enhanced with Payment Creation
const Seat = require('../models/Seat');
const Student = require('../models/Student');
const Payment = require('../models/Payment');
const Shift = require('../models/Shift');
const ApiError = require('../utils/ApiError');
const { asyncHandler } = require('../utils/asyncHandler');
const mongoose = require('mongoose');

// Assign student to seat - Enhanced with Payment Creation
// Remove transactions from assignStudentToSeat function
const assignStudentToSeat = asyncHandler(async (req, res) => {
  try {
    const { seatId } = req.params;
    const { studentId, shiftId, startDate, feeDetails, documents, createdBy } = req.body;

    console.log('=== ASSIGN STUDENT TO SEAT START ===');
    console.log('Seat ID from params:', seatId);
    console.log('Student ID from request body:', studentId);
    console.log('Shift ID from request body:', shiftId);

    // Validate studentId format
    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      console.error('Invalid student ID format:', studentId);
      throw new ApiError(400, 'Invalid student ID format');
    }

    const seat = await Seat.findById(seatId);
    if (!seat) {
      console.error('Seat not found with ID:', seatId);
      throw new ApiError(404, 'Seat not found');
    }

    const student = await Student.findById(studentId);
    if (!student) {
      console.error('Student not found with ID:', studentId);
      throw new ApiError(404, 'Student not found');
    }

    const shift = await Shift.findById(shiftId);
    if (!shift) {
      console.error('Shift not found with ID:', shiftId);
      throw new ApiError(404, 'Shift not found');
    }

    // Check if seat is available for this shift
    if (!seat.isAvailableForShift(shiftId)) {
      console.error('Seat not available for shift:', shiftId);
      throw new ApiError(400, 'Seat is not available for this shift');
    }

    // Check if student already has active assignment for this shift
    const existingAssignment = student.currentAssignments.find(
      assignment => assignment.shift && assignment.shift.toString() === shiftId && assignment.status === 'active'
    );
    if (existingAssignment) {
      console.error('Student already has active assignment for this shift');
      throw new ApiError(400, 'Student already has an active assignment for this shift');
    }

    // Convert startDate to Date object if it's a string
    const assignmentStartDate = startDate ? new Date(startDate) : new Date();
    
    const assignmentData = {
      startDate: assignmentStartDate,
      feeDetails: {
        amount: feeDetails?.amount || shift.fee,
        collected: feeDetails?.collected || 0,
        balance: (feeDetails?.amount || shift.fee) - (feeDetails?.collected || 0)
      },
      documents: documents || [],
      createdBy: createdBy || req.user?._id
    };

    console.log('Assignment data:', assignmentData);

    try {
      // 1. Create payment record first
      const paymentAmount = feeDetails?.amount || shift.fee;
      const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Calculate period end date (30 days from start date)
      const periodEndDate = new Date(assignmentStartDate);
      periodEndDate.setDate(periodEndDate.getDate() + 30);
      
      const paymentData = {
        student: studentId,
        seat: seatId,
        shift: shiftId,
        property: seat.propertyId,
        assignment: new mongoose.Types.ObjectId(), // We'll update this after assignment creation
        amount: paymentAmount,
        status: 'pending',
        paymentMethod: 'cash',
        transactionId: transactionId,
        paymentDate: null, // Will be set when payment is completed
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        period: {
          start: assignmentStartDate,
          end: periodEndDate
        },
        feeType: 'seat_rent',
        description: `Seat rent for ${student.firstName} ${student.lastName || ''} - ${shift.name} shift`,
        paymentBreakdown: [
          {
            description: 'Seat Rent',
            amount: paymentAmount,
            type: 'base_fee'
          }
        ],
        createdBy: createdBy || req.user?._id,
        notes: `Auto-generated payment for seat assignment`
      };

      console.log('Creating payment record:', paymentData);
      const payment = await Payment.create(paymentData);

      // 2. Update assignment data with payment reference
      assignmentData.payment = payment._id;

      // 3. Assign student to seat
      await seat.assignStudent(studentId, shiftId, assignmentData);
      
      // 4. Create assignment in student record
      await student.assignToSeat(seatId, shiftId, assignmentData);

      // 5. Update payment with the actual assignment ID
      const studentAssignment = student.currentAssignments.find(
        assignment => assignment.seat.toString() === seatId && 
                     assignment.shift.toString() === shiftId && 
                     assignment.status === 'active'
      );

      if (studentAssignment) {
        await Payment.findByIdAndUpdate(
          payment._id,
          { assignment: studentAssignment._id }
        );
      }

      const updatedSeat = await Seat.findById(seatId)
        .populate('currentAssignments.student')
        .populate('currentAssignments.shift')
        .populate('currentAssignments.payment');

      console.log('=== ASSIGN STUDENT TO SEAT END - SUCCESS ===');

      res.status(200).json({
        success: true,
        message: 'Student assigned to seat successfully',
        data: {
          seat: updatedSeat,
          payment: {
            id: payment._id,
            amount: payment.amount,
            status: payment.status,
            transactionId: payment.transactionId,
            dueDate: payment.dueDate
          }
        }
      });

    } catch (error) {
      // If any operation fails, try to clean up
      console.error('Error during assignment process:', error);
      
      // Delete the payment record if it was created but assignment failed
      if (payment && payment._id) {
        try {
          await Payment.findByIdAndDelete(payment._id);
        } catch (deleteError) {
          console.error('Error cleaning up payment record:', deleteError);
        }
      }
      
      throw error;
    }

  } catch (error) {
    console.error('Error in assignStudentToSeat:', error);
    throw error;
  }
});

// Enhanced releaseStudentFromSeat to handle payment updates
const releaseStudentFromSeat = asyncHandler(async (req, res) => {
  const { seatId } = req.params;
  const { studentId, shiftId, refundAmount = 0, refundReason } = req.body;

  const seat = await Seat.findById(seatId);
  if (!seat) {
    throw new ApiError(404, 'Seat not found');
  }

  const student = await Student.findById(studentId);
  if (!student) {
    throw new ApiError(404, 'Student not found');
  }

  // Start a session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find the assignment to get payment reference
    const assignment = seat.currentAssignments.find(
      assignment => assignment.student.toString() === studentId && 
                   assignment.shift.toString() === shiftId && 
                   assignment.status === 'active'
    );

    if (!assignment) {
      throw new ApiError(404, 'Active assignment not found');
    }

    // If there's a payment record and refund is requested
    if (assignment.payment && refundAmount > 0) {
      const payment = await Payment.findById(assignment.payment);
      if (payment && payment.status === 'completed') {
        // Create refund record
        payment.refundDetails = {
          amount: refundAmount,
          reason: refundReason || 'Seat release refund',
          refundDate: new Date(),
          processedBy: req.user?._id
        };
        payment.status = 'refunded';
        await payment.save({ session });
      }
    }

    // Release from both seat and student
    await seat.releaseStudent(studentId, shiftId);
    await student.releaseFromSeat(seatId, shiftId);

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Student released from seat successfully',
      refundProcessed: refundAmount > 0
    });

  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

// Enhanced changeStudentSeat to handle payment transfer
const changeStudentSeat = asyncHandler(async (req, res) => {
  try {
    const { currentSeatId, newSeatId, studentId, shiftId, reason, transferPayment = true } = req.body;

    console.log('=== CHANGE STUDENT SEAT START ===');

    // Validate inputs
    if (!currentSeatId || !newSeatId || !studentId || !shiftId) {
      throw new ApiError(400, 'currentSeatId, newSeatId, studentId, and shiftId are required');
    }

    if (currentSeatId === newSeatId) {
      throw new ApiError(400, 'New seat cannot be the same as current seat');
    }

    // Find all entities in parallel
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

    // Verify student is actually assigned to current seat for this shift
    const currentAssignment = currentSeat.currentAssignments.find(
      assignment => assignment.student.toString() === studentId && 
                   assignment.shift.toString() === shiftId && 
                   assignment.status === 'active'
    );

    if (!currentAssignment) {
      throw new ApiError(400, 'Student is not assigned to the current seat for this shift');
    }

    // Check if new seat is available for this shift
    if (!newSeat.isAvailableForShift(shiftId)) {
      throw new ApiError(400, 'New seat is not available for this shift');
    }

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Release student from current seat
      await currentSeat.releaseStudent(studentId, shiftId);
      
      // 2. Create new payment record for new seat if transferPayment is true
      let newPaymentId = currentAssignment.payment;
      
      if (transferPayment && currentAssignment.payment) {
        // Create a new payment record for the new seat
        const currentPayment = await Payment.findById(currentAssignment.payment);
        if (currentPayment) {
          const newTransactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const newPaymentData = {
            student: studentId,
            seat: newSeatId,
            shift: shiftId,
            property: newSeat.propertyId,
            amount: currentPayment.amount,
            status: currentPayment.status,
            paymentMethod: currentPayment.paymentMethod,
            transactionId: newTransactionId,
            paymentDate: currentPayment.paymentDate,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            period: {
              start: new Date(),
              end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            },
            feeType: 'seat_rent',
            description: `Seat transfer: ${reason || 'No reason provided'}. Previous payment: ${currentPayment.transactionId}`,
            paymentBreakdown: currentPayment.paymentBreakdown,
            createdBy: req.user?._id,
            notes: `Transferred from seat ${currentSeat.seatNumber} to ${newSeat.seatNumber}`
          };

          const newPayment = await Payment.create([newPaymentData], { session });
          newPaymentId = newPayment[0]._id;
        }
      }

      // 3. Assign student to new seat
      const assignmentData = {
        startDate: new Date(),
        feeDetails: currentAssignment.feeDetails,
        documents: currentAssignment.documents || [],
        createdBy: currentAssignment.createdBy || req.user?._id,
        payment: newPaymentId,
        reason: reason || 'Seat change'
      };

      await newSeat.assignStudent(studentId, shiftId, assignmentData);

      // 4. Update student's assignment record
      await student.releaseFromSeat(currentSeatId, shiftId);
      await student.assignToSeat(newSeatId, shiftId, assignmentData);

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      console.log('=== CHANGE STUDENT SEAT END - SUCCESS ===');

      // Fetch updated data
      const [updatedCurrentSeat, updatedNewSeat] = await Promise.all([
        Seat.findById(currentSeatId)
          .populate('currentAssignments.student')
          .populate('currentAssignments.shift')
          .populate('currentAssignments.payment'),
        Seat.findById(newSeatId)
          .populate('currentAssignments.student')
          .populate('currentAssignments.shift')
          .populate('currentAssignments.payment')
      ]);

      res.status(200).json({
        success: true,
        message: 'Seat changed successfully',
        data: {
          previousSeat: updatedCurrentSeat,
          newSeat: updatedNewSeat,
          student: {
            _id: student._id,
            fullName: student.fullName
          },
          shift: {
            _id: shift._id,
            name: shift.name
          },
          paymentTransferred: transferPayment
        }
      });

    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

  } catch (error) {
    console.error('Error in changeStudentSeat:', error);
    throw error;
  }
});

// Keep other functions the same (they don't need payment integration)
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
        path: 'currentAssignments.payment',
        select: 'amount status paymentDate transactionId'
      });

    // Filter by shift if provided
    let filteredSeats = seats;
    if (shift) {
      filteredSeats = seats.filter(seat => 
        seat.currentAssignments.some(assignment => 
          assignment.shift && assignment.shift._id.toString() === shift
        )
      );
    }

    res.json(filteredSeats);
  } catch (error) {
    console.error('Error fetching seats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch seat data',
      message: error.message 
    });
  }
});

// Create multiple seats
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
  res.status(201).json(createdSeats);
});

// Reserve a seat
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
  res.json(seat);
});

// Update seat status
const updateSeatStatus = asyncHandler(async (req, res) => {
  let { status } = req.body;
  
  // Handle the case where status might be an object
  if (status && typeof status === 'object' && status.status) {
    status = status.status;
  }
  
  // Validate status
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

// Delete a seat
const deleteSeat = asyncHandler(async (req, res) => {
  const seat = await Seat.findById(req.params.id);

  if (!seat) {
    throw new ApiError(404, 'Seat not found');
  }

  // Check if seat has active assignments
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

// Bulk update seats
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

// Get seat assignment history
const getSeatAssignmentHistory = asyncHandler(async (req, res) => {
  const { seatId } = req.params;
  
  const seat = await Seat.findById(seatId)
    .populate('assignmentHistory.student', 'firstName lastName email phone')
    .populate('assignmentHistory.shift', 'name startTime endTime')
    .populate('assignmentHistory.payment', 'amount status paymentDate');

  if (!seat) {
    throw new ApiError(404, 'Seat not found');
  }

  res.json({
    success: true,
    data: seat.assignmentHistory
  });
});

const deassignStudent = asyncHandler(async (req, res) => {
  const { seatId } = req.params;
  const { studentId, shiftId, reason } = req.body;

  const seat = await Seat.findById(seatId);
  if (!seat) {
    throw new ApiError(404, 'Seat not found');
  }

  const student = await Student.findById(studentId);
  if (!student) {
    throw new ApiError(404, 'Student not found');
  }

  // Release from both seat and student
  await seat.releaseStudent(studentId, shiftId);
  await student.releaseFromSeat(seatId, shiftId);

  // Log the deassignment reason if provided
  if (reason) {
    console.log(`Student ${studentId} deassigned from seat ${seatId}. Reason: ${reason}`);
  }

  res.status(200).json({
    success: true,
    message: 'Student deassigned successfully'
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