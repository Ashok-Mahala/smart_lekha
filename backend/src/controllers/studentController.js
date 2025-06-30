const Student = require('../models/Student');
const Seat = require('../models/Seat');
const Shift = require('../models/Shift');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { ApiError } = require('../utils/ApiError');
const { asyncHandler } = require('../utils/asyncHandler');

const getStudentsByProperty = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  if (!propertyId) throw new ApiError(400, 'Property ID is required');

  // Step 1: Get students with populated currentSeat & nested population
  const students = await Student.find()
    .populate({
      path: 'currentSeat',
      match: { propertyId },
      select: 'seatNumber propertyId currentStudents',
      populate: [
        {
          path: 'currentStudents.student',
          select: '_id firstName lastName email phone'
        },
        {
          path: 'currentStudents.booking',
        },
        {
          path: 'currentStudents.shift'
        }
      ]
    })
    .sort({ createdAt: -1 });

  // Step 2: Filter only students whose currentSeat belongs to this property
  const filteredStudents = students.filter(s => s.currentSeat && s.currentSeat.propertyId.toString() === propertyId);

  // Step 3: Enrich with shift, booking, payment
  const enriched = await Promise.all(filteredStudents.map(async (student) => {
    const currentSeat = student.currentSeat;
    const studentId = student._id.toString();

    // Find the matching currentStudent record
    const matchedEntry = currentSeat?.currentStudents.find(cs =>
      cs.student && cs.student._id.toString() === studentId
    );

    if (!matchedEntry) {
      return {
        ...student.toObject(),
        shift: null,
        booking: null,
        payment: null
      };
    }

    const booking = matchedEntry.booking || await Booking.findById(matchedEntry.booking).lean();
    const shift = matchedEntry.shift || await Shift.findById(matchedEntry.shift).lean();

    // Find one payment associated with the booking
    const payment = await Payment.findOne({ booking: booking?._id }).lean();

    return {
      ...student.toObject(),
      shift,
      booking,
      payment
    };
  }));

  res.json({ students: enriched });
});


const getStudentStatsByProperty = asyncHandler(async (req, res) => {
  const { propertyId } = req.query;
  if (!propertyId) throw new ApiError(400, 'Property ID is required');

  const students = await Student.find({ status: { $in: ['active', 'inactive'] } })
    .populate('currentSeat');

  const filtered = students.filter(s => s.currentSeat?.propertyId?.toString() === propertyId);
  const stats = {
    totalStudents: filtered.length,
    activeStudents: filtered.filter(s => s.status === 'active').length,
    inactiveStudents: filtered.filter(s => s.status === 'inactive').length
  };
  res.json(stats);
});

module.exports = {
  getStudentsByProperty,
  getStudentById: asyncHandler(async (req, res) => {
    const student = await Student.findById(req.params.id).populate('currentSeat');
    if (!student) throw new ApiError(404, 'Student not found');
    res.json(student);
  }),
  createStudent: asyncHandler(async (req, res) => {
    const student = new Student(req.body);
    await student.save();
    res.status(201).json(student);
  }),
  updateStudent: asyncHandler(async (req, res) => {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!student) throw new ApiError(404, 'Student not found');
    res.json(student);
  }),
  deleteStudent: asyncHandler(async (req, res) => {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) throw new ApiError(404, 'Student not found');
    res.json({ message: 'Deleted' });
  }),
  getStudentStatsByProperty
};