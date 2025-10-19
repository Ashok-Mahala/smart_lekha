const Student = require('../models/Student');
const Seat = require('../models/Seat');
const Shift = require('../models/Shift');
const Payment = require('../models/Payment');
const ApiError = require('../utils/ApiError'); // Fixed import
const { asyncHandler } = require('../utils/asyncHandler');

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
      select: 'amount status paymentDate'
    })
    .sort({ createdAt: -1 });

  // Filter students with assignments in this property
  const filteredStudents = students.filter(student => 
    student.currentAssignments.some(assignment => 
      assignment.seat && assignment.seat.propertyId.toString() === propertyId
    )
  );

  res.json({ students: filteredStudents });
});

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

  res.json(student);
});

const getStudentStatsByProperty = asyncHandler(async (req, res) => {
  const { propertyId } = req.query;
  if (!propertyId) throw new ApiError(400, 'Property ID is required');

  const students = await Student.find({ status: 'active' })
    .populate('currentAssignments.seat');

  const filtered = students.filter(student => 
    student.currentAssignments.some(assignment => 
      assignment.seat && assignment.seat.propertyId.toString() === propertyId
    )
  );

  const stats = {
    totalStudents: filtered.length,
    activeStudents: filtered.filter(s => s.status === 'active').length,
    studentsWithAssignments: filtered.filter(s => s.currentAssignments.length > 0).length
  };

  res.json(stats);
});

const createStudent = asyncHandler(async (req, res) => {
  try {
    console.log('=== CREATE STUDENT REQUEST START ===');
    console.log('Request headers:', req.headers);
    console.log('Request Content-Type:', req.get('Content-Type'));
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    console.log('Files keys:', req.files ? Object.keys(req.files) : 'No files');
    
    let studentData = {};
    
    // Check if the request contains files (FormData)
    if (req.files && Object.keys(req.files).length > 0) {
      console.log('Processing FormData request');
      
      // Log all fields from req.body
      console.log('Available fields in req.body:', Object.keys(req.body));
      console.log('firstName from req.body:', req.body.firstName);
      console.log('email from req.body:', req.body.email);
      console.log('phone from req.body:', req.body.phone);
      
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
          console.log('Processing file:', file.fieldname, file.originalname);
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
      console.error('Missing firstName');
      throw new ApiError(400, 'First name is required');
    }
    if (!studentData.email) {
      console.error('Missing email');
      throw new ApiError(400, 'Email is required');
    }
    if (!studentData.phone) {
      console.error('Missing phone');
      throw new ApiError(400, 'Phone is required');
    }

    console.log('All required fields present');

    // Check if student with same email already exists
    const existingStudent = await Student.findOne({ email: studentData.email });
    if (existingStudent) {
      console.error('Student already exists with email:', studentData.email);
      throw new ApiError(400, 'Student with this email already exists');
    }

    console.log('Creating new student in database...');
    const student = new Student(studentData);
    await student.save();
    console.log('Student created successfully with ID:', student._id);
    
    const populatedStudent = await Student.findById(student._id)
      .populate('currentAssignments.seat')
      .populate('currentAssignments.shift');

    console.log('=== CREATE STUDENT REQUEST END ===');

    res.status(201).json({
      success: true,
      data: populatedStudent
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
  res.json({ message: 'Student deleted successfully' });
});

// Get student's assignment history
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

// Get student's current assignments
const getStudentCurrentAssignments = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id)
    .populate('currentAssignments.seat')
    .populate('currentAssignments.shift')
    .populate('currentAssignments.payment');

  if (!student) throw new ApiError(404, 'Student not found');

  res.json({
    success: true,
    data: student.currentAssignments
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
      select: 'amount status paymentDate'
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