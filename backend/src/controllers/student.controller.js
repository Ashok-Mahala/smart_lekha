const Student = require('../models/Student');
const User = require('../models/User');
const { ApiError, ERROR_TYPES, ERROR_CODES } = require('../middleware/errorHandler');

const createStudent = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(
        ERROR_TYPES.UNAUTHORIZED, 
        'User not authenticated',
        null,
        ERROR_CODES.UNAUTHORIZED
      );
    }

    const {
      name,
      email,
      phone,
      course,
      status,
      notes
    } = req.body;

    // Check if email already exists
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      throw new ApiError(
        ERROR_TYPES.CONFLICT,
        'Email already registered',
        { field: 'email' },
        ERROR_CODES.ALREADY_EXISTS
      );
    }

    const student = new Student({
      name,
      email,
      phone,
      course,
      status: status || 'active',
      notes,
      createdBy: req.user._id
    });

    await student.save();

    res.status(201).json({
      message: 'Student created successfully',
      student: await student.populate('createdBy')
    });
  } catch (error) {
    next(error);
  }
};

const getAllStudents = async (req, res, next) => {
  try {
    const { status, gender, course, search } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (gender) filter.gender = gender;
    if (course) filter.course = course;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await Student.find(filter)
      .populate('createdBy')
      .sort({ createdAt: -1 });

    res.json(students);
  } catch (error) {
    next(error);
  }
};

const getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('createdBy');
    
    if (!student) {
      throw new ApiError(
        ERROR_TYPES.NOT_FOUND,
        'Student not found',
        { id: req.params.id },
        ERROR_CODES.NOT_FOUND
      );
    }

    res.json(student);
  } catch (error) {
    next(error);
  }
};

const updateStudent = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(
        ERROR_TYPES.UNAUTHORIZED, 
        'User not authenticated',
        null,
        ERROR_CODES.UNAUTHORIZED
      );
    }

    const {
      name,
      email,
      phone,
      course,
      status,
      notes
    } = req.body;

    const student = await Student.findById(req.params.id);
    
    if (!student) {
      throw new ApiError(
        ERROR_TYPES.NOT_FOUND,
        'Student not found',
        { id: req.params.id },
        ERROR_CODES.NOT_FOUND
      );
    }

    // Check if email is being changed and if it already exists
    if (email && email !== student.email) {
      const existingStudent = await Student.findOne({ email });
      if (existingStudent) {
        throw new ApiError(
          ERROR_TYPES.CONFLICT,
          'Email already registered',
          { field: 'email' },
          ERROR_CODES.ALREADY_EXISTS
        );
      }
    }

    if (name) student.name = name;
    if (email) student.email = email;
    if (phone) student.phone = phone;
    if (course) student.course = course;
    if (status) student.status = status;
    if (notes) student.notes = notes;

    student.updatedAt = new Date();
    student.updatedBy = req.user._id;
    await student.save();

    res.json({
      message: 'Student updated successfully',
      student: await student.populate(['createdBy', 'updatedBy'])
    });
  } catch (error) {
    next(error);
  }
};

const deleteStudent = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(
        ERROR_TYPES.UNAUTHORIZED, 
        'User not authenticated',
        null,
        ERROR_CODES.UNAUTHORIZED
      );
    }

    const student = await Student.findById(req.params.id);
    
    if (!student) {
      throw new ApiError(
        ERROR_TYPES.NOT_FOUND,
        'Student not found',
        { id: req.params.id },
        ERROR_CODES.NOT_FOUND
      );
    }

    await student.deleteOne();

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const getStudentsByCourse = async (req, res, next) => {
  try {
    const { course } = req.params;
    const { status } = req.query;
    
    const filter = { course };
    if (status) filter.status = status;

    const students = await Student.find(filter)
      .populate('createdBy')
      .sort({ name: 1 });

    res.json(students);
  } catch (error) {
    next(error);
  }
};

const getStudentsSummary = async (req, res, next) => {
  try {
    const summary = await Student.aggregate([
      {
        $group: {
          _id: null,
          totalStudents: { $sum: 1 },
          activeStudents: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          courses: {
            $addToSet: '$course'
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalStudents: 1,
          activeStudents: 1,
          courses: 1
        }
      }
    ]);

    res.json(summary[0] || { totalStudents: 0, activeStudents: 0, courses: [] });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getStudentsByCourse,
  getStudentsSummary
}; 