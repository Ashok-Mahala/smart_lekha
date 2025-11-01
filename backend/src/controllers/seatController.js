const Seat = require('../models/Seat');
const Student = require('../models/Student');
const Payment = require('../models/Payment');
const Shift = require('../models/Shift');
const ApiError = require('../utils/ApiError');
const { asyncHandler } = require('../utils/asyncHandler');
const mongoose = require('mongoose');

// Get all seats for a property
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
        select: 'amount status paymentDate'
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

// Assign student to seat
const assignStudentToSeat = asyncHandler(async (req, res) => {
  try {
    const { seatId } = req.params;
    const { studentId, shiftId, startDate, feeDetails, documents, createdBy } = req.body;

    console.log('=== ASSIGN STUDENT TO SEAT START ===');
    console.log('Seat ID from params:', seatId);
    console.log('Student ID from request body:', studentId);
    console.log('Shift ID from request body:', shiftId);
    console.log('Full request body:', req.body);

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

    console.log('Found seat:', seat._id);

    // Try to find student with detailed logging
    console.log('Searching for student with ID:', studentId);
    const student = await Student.findById(studentId);
    
    if (!student) {
      console.error('Student not found with ID:', studentId);
      
      // List all students in database for debugging
      const allStudents = await Student.find({}).select('_id firstName email').limit(10);
      console.log('Available students in database:', allStudents);
      
      throw new ApiError(404, 'Student not found');
    }

    console.log('Found student:', student._id, student.firstName, student.email);

    const shift = await Shift.findById(shiftId);
    if (!shift) {
      console.error('Shift not found with ID:', shiftId);
      throw new ApiError(404, 'Shift not found');
    }

    console.log('Found shift:', shift._id, shift.name);

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

    const assignmentData = {
      startDate: startDate || new Date(),
      feeDetails: {
        amount: feeDetails?.amount || shift.fee,
        collected: feeDetails?.collected || 0,
        balance: (feeDetails?.amount || shift.fee) - (feeDetails?.collected || 0)
      },
      documents: documents || [],
      createdBy: createdBy || req.user?._id
    };

    console.log('Assignment data:', assignmentData);

    // Assign student to seat
    await seat.assignStudent(studentId, shiftId, assignmentData);
    
    // Create assignment in student record
    await student.assignToSeat(seatId, shiftId, assignmentData);

    const updatedSeat = await Seat.findById(seatId)
      .populate('currentAssignments.student')
      .populate('currentAssignments.shift');

    console.log('=== ASSIGN STUDENT TO SEAT END - SUCCESS ===');

    res.status(200).json({
      success: true,
      message: 'Student assigned to seat successfully',
      data: updatedSeat
    });

  } catch (error) {
    console.error('Error in assignStudentToSeat:', error);
    throw error;
  }
});

// Release student from seat
const releaseStudentFromSeat = asyncHandler(async (req, res) => {
  const { seatId } = req.params;
  const { studentId, shiftId } = req.body;

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

  res.status(200).json({
    success: true,
    message: 'Student released from seat successfully'
  });
});

// Cancel assignment
const cancelAssignment = asyncHandler(async (req, res) => {
  const { seatId } = req.params;
  const { studentId, shiftId } = req.body;

  const seat = await Seat.findById(seatId);
  if (!seat) {
    throw new ApiError(404, 'Seat not found');
  }

  const student = await Student.findById(studentId);
  if (!student) {
    throw new ApiError(404, 'Student not found');
  }

  // Cancel from both seat and student
  await seat.cancelAssignment(studentId, shiftId);
  await student.cancelAssignment(seatId, shiftId);

  res.status(200).json({
    success: true,
    message: 'Assignment cancelled successfully'
  });
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

// Get seat statistics for a property
const getSeatStats = asyncHandler(async (req, res) => {
  const { propertyId } = req.query;
  
  if (!propertyId) {
    throw new ApiError(400, 'Property ID is required');
  }

  const stats = await Seat.aggregate([
    { $match: { propertyId: new mongoose.Types.ObjectId(propertyId) } },
    { $group: { 
      _id: '$status', 
      count: { $sum: 1 }
    }},
    { $project: {
      status: '$_id',
      count: 1,
      _id: 0
    }}
  ]);

  const total = await Seat.countDocuments({ propertyId });
  const occupied = await Seat.countDocuments({ 
    propertyId, 
    status: 'occupied' 
  });
  const available = await Seat.countDocuments({ 
    propertyId, 
    status: 'available' 
  });

  res.json({
    total,
    occupied,
    available,
    stats,
    propertyId
  });
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

// Bulk delete seats
const bulkDeleteSeats = asyncHandler(async (req, res) => {
  const seatIds = req.body;
  
  // Check if any seat has active assignments
  const seatsWithAssignments = await Seat.find({
    _id: { $in: seatIds },
    'currentAssignments.status': 'active'
  });

  if (seatsWithAssignments.length > 0) {
    throw new ApiError(400, 'Some seats have active assignments and cannot be deleted');
  }

  const result = await Seat.updateMany(
    { _id: { $in: seatIds } },
    { 
      $set: { 
        status: 'deleted', 
        deletedAt: new Date() 
      } 
    }
  );

  res.json({
    success: true,
    deletedCount: result.modifiedCount
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

// controllers/seatController.js - Add these functions
const getSeatDetailedHistory = asyncHandler(async (req, res) => {
  const { seatId } = req.params;
  
  const seat = await Seat.findById(seatId);
  if (!seat) {
    throw new ApiError(404, 'Seat not found');
  }

  const detailedHistory = await seat.getDetailedHistory();
  
  res.json({
    success: true,
    data: detailedHistory
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

// Change student seat assignment
const changeStudentSeat = asyncHandler(async (req, res) => {
  try {
    const { currentSeatId, newSeatId, studentId, shiftId, reason } = req.body;

    console.log('=== CHANGE STUDENT SEAT START ===');
    console.log('Current Seat ID:', currentSeatId);
    console.log('New Seat ID:', newSeatId);
    console.log('Student ID:', studentId);
    console.log('Shift ID:', shiftId);

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

    console.log('All entities found successfully');

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
      
      // 2. Assign student to new seat
      const assignmentData = {
        startDate: new Date(),
        feeDetails: currentAssignment.feeDetails,
        documents: currentAssignment.documents || [],
        createdBy: currentAssignment.createdBy || req.user?._id,
        reason: reason || 'Seat change'
      };

      await newSeat.assignStudent(studentId, shiftId, assignmentData);

      // 3. Update student's assignment record
      await student.releaseFromSeat(currentSeatId, shiftId);
      await student.assignToSeat(newSeatId, shiftId, assignmentData);

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      console.log('=== CHANGE STUDENT SEAT END - SUCCESS ===');

      // Fetch updated seats with populated data
      const [updatedCurrentSeat, updatedNewSeat] = await Promise.all([
        Seat.findById(currentSeatId)
          .populate('currentAssignments.student')
          .populate('currentAssignments.shift'),
        Seat.findById(newSeatId)
          .populate('currentAssignments.student')
          .populate('currentAssignments.shift')
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
          }
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


module.exports = {
  getSeatsByProperty,
  assignStudentToSeat,
  releaseStudentFromSeat,
  cancelAssignment,
  bulkCreateSeats,
  reserveSeat,
  getSeatStats,
  updateSeatStatus,
  deleteSeat,
  bulkUpdateSeats,
  bulkDeleteSeats,
  getSeatAssignmentHistory,
  getSeatDetailedHistory,
  deassignStudent,
  changeStudentSeat
};