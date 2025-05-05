const ExcelJS = require('exceljs');
const Student = require('../models/Student');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

const generateStudentReport = async (filters = {}) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Students');

  // Add headers
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Name', key: 'name', width: 30 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Phone', key: 'phone', width: 20 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Created At', key: 'createdAt', width: 20 }
  ];

  // Get students based on filters
  const students = await Student.find(filters).sort({ createdAt: -1 });

  // Add data rows
  students.forEach(student => {
    worksheet.addRow({
      id: student._id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      status: student.status,
      createdAt: student.createdAt.toISOString()
    });
  });

  return workbook;
};

const generateBookingReport = async (filters = {}) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Bookings');

  // Add headers
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Student', key: 'student', width: 30 },
    { header: 'Property', key: 'property', width: 30 },
    { header: 'Start Date', key: 'startDate', width: 15 },
    { header: 'End Date', key: 'endDate', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Amount', key: 'amount', width: 15 }
  ];

  // Get bookings based on filters
  const bookings = await Booking.find(filters)
    .populate('student', 'name')
    .populate('property', 'name')
    .sort({ createdAt: -1 });

  // Add data rows
  bookings.forEach(booking => {
    worksheet.addRow({
      id: booking._id,
      student: booking.student.name,
      property: booking.property.name,
      startDate: booking.startDate.toISOString().split('T')[0],
      endDate: booking.endDate.toISOString().split('T')[0],
      status: booking.status,
      amount: booking.amount
    });
  });

  return workbook;
};

const generatePaymentReport = async (filters = {}) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Payments');

  // Add headers
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Booking', key: 'booking', width: 30 },
    { header: 'Amount', key: 'amount', width: 15 },
    { header: 'Method', key: 'method', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Date', key: 'date', width: 20 }
  ];

  // Get payments based on filters
  const payments = await Payment.find(filters)
    .populate('booking')
    .sort({ createdAt: -1 });

  // Add data rows
  payments.forEach(payment => {
    worksheet.addRow({
      id: payment._id,
      booking: payment.booking._id,
      amount: payment.amount,
      method: payment.method,
      status: payment.status,
      date: payment.createdAt.toISOString()
    });
  });

  return workbook;
};

module.exports = {
  generateStudentReport,
  generateBookingReport,
  generatePaymentReport
}; 