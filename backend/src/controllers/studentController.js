const Student = require('../models/Student');
const { ApiError } = require('../utils/ApiError');
const { asyncHandler } = require('../utils/asyncHandler');

// Get all students with pagination and filters
const getStudents = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, course, batch } = req.query;
  const query = {};

  if (status) query.status = status;
  if (course) query.course = course;
  if (batch) query.batch = batch;

  const students = await Student.find(query)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

  const count = await Student.countDocuments(query);

  res.json({
    students,
    totalPages: Math.ceil(count / limit),
    currentPage: page
  });
});

// Get student by ID
const getStudentById = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) {
    throw new ApiError(404, 'Student not found');
  }
  res.json(student);
});

// Create new student
const createStudent = asyncHandler(async (req, res) => {
  const student = new Student(req.body);
  await student.save();
  res.status(201).json(student);
});

// Update student
const updateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  if (!student) {
    throw new ApiError(404, 'Student not found');
  }
  res.json(student);
});

// Delete student
const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) {
    throw new ApiError(404, 'Student not found');
  }
  res.json({ message: 'Student deleted successfully' });
});

// Get student statistics
const getStudentStats = asyncHandler(async (req, res) => {
  const stats = await Student.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  res.json(stats);
});

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentStats
}; 