const { asyncHandler } = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Seat = require('../models/Seat');

// @desc    Get all attendance records
// @route   GET /smlekha/attendance
// @access  Private
exports.getAttendanceRecords = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  const query = {};
  if (req.query.student) query.student = req.query.student;
  if (req.query.seat) query.seat = req.query.seat;
  if (req.query.status) query.status = req.query.status;
  if (req.query.date) {
    const date = new Date(req.query.date);
    query.date = {
      $gte: new Date(date.setHours(0, 0, 0, 0)),
      $lt: new Date(date.setHours(23, 59, 59, 999))
    };
  }

  const attendance = await Attendance.find(query)
    .populate('student', 'name studentId')
    .populate('seat', 'seatNumber row column')
    .skip(startIndex)
    .limit(limit)
    .sort('-date');

  const total = await Attendance.countDocuments(query);

  res.status(200).json({
    success: true,
    count: attendance.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    data: attendance
  });
});

// @desc    Get single attendance record
// @route   GET /smlekha/attendance/:id
// @access  Private
exports.getAttendanceById = asyncHandler(async (req, res) => {
  const attendance = await Attendance.findById(req.params.id)
    .populate('student', 'name studentId')
    .populate('seat', 'seatNumber row column');

  if (!attendance) {
    throw new ApiError(404, 'Attendance record not found');
  }

  res.status(200).json({
    success: true,
    data: attendance
  });
});

// @desc    Create attendance record
// @route   POST /smlekha/attendance
// @access  Private
exports.createAttendance = asyncHandler(async (req, res) => {
  const { student, seat, date, status, notes } = req.body;

  // Check if student exists
  const studentExists = await Student.findById(student);
  if (!studentExists) {
    throw new ApiError(404, 'Student not found');
  }

  // Check if seat exists
  const seatExists = await Seat.findById(seat);
  if (!seatExists) {
    throw new ApiError(404, 'Seat not found');
  }

  // Check for existing attendance record
  const existingAttendance = await Attendance.findOne({
    student,
    date: {
      $gte: new Date(date).setHours(0, 0, 0, 0),
      $lt: new Date(date).setHours(23, 59, 59, 999)
    }
  });

  if (existingAttendance) {
    throw new ApiError(400, 'Attendance record already exists for this student on this date');
  }

  const attendance = await Attendance.create({
    student,
    seat,
    date,
    status,
    notes,
    recordedBy: req.user.id
  });

  res.status(201).json({
    success: true,
    data: attendance
  });
});

// @desc    Update attendance record
// @route   PUT /smlekha/attendance/:id
// @access  Private
exports.updateAttendance = asyncHandler(async (req, res) => {
  const attendance = await Attendance.findById(req.params.id);

  if (!attendance) {
    throw new ApiError(404, 'Attendance record not found');
  }

  const updatedAttendance = await Attendance.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: updatedAttendance
  });
});

// @desc    Delete attendance record
// @route   DELETE /smlekha/attendance/:id
// @access  Private/Admin
exports.deleteAttendance = asyncHandler(async (req, res) => {
  const attendance = await Attendance.findById(req.params.id);

  if (!attendance) {
    throw new ApiError(404, 'Attendance record not found');
  }

  await attendance.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get attendance statistics
// @route   GET /smlekha/attendance/stats
// @access  Private/Admin
exports.getAttendanceStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const query = {};

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const stats = await Attendance.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const totalRecords = await Attendance.countDocuments(query);
  const presentCount = await Attendance.countDocuments({ ...query, status: 'present' });
  const absentCount = await Attendance.countDocuments({ ...query, status: 'absent' });
  const lateCount = await Attendance.countDocuments({ ...query, status: 'late' });

  res.status(200).json({
    success: true,
    data: {
      stats,
      totalRecords,
      presentCount,
      absentCount,
      lateCount,
      attendanceRate: totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0
    }
  });
});

// @desc    Get student attendance history
// @route   GET /smlekha/attendance/student/:studentId
// @access  Private
exports.getStudentAttendance = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { startDate, endDate } = req.query;

  const query = { student: studentId };
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const attendance = await Attendance.find(query)
    .populate('seat', 'seatNumber row column')
    .sort('-date');

  const stats = await Attendance.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      records: attendance,
      stats
    }
  });
}); 