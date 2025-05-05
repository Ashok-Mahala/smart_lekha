const { generateStudentReport, generateBookingReport, generatePaymentReport } = require('../utils/reportGenerator');
const Student = require('../models/Student');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const User = require('../models/User');

const generateReport = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const {
      type,
      startDate,
      endDate,
      filters
    } = req.body;

    let reportData;
    switch (type) {
      case 'attendance':
        reportData = await generateAttendanceReport(startDate, endDate, filters);
        break;
      case 'financial':
        reportData = await generateFinancialReport(startDate, endDate, filters);
        break;
      case 'student':
        reportData = await generateStudentReport(startDate, endDate, filters);
        break;
      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    res.json({
      message: 'Report generated successfully',
      report: {
        type,
        startDate,
        endDate,
        generatedAt: new Date(),
        generatedBy: req.user._id,
        data: reportData
      }
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ message: 'Error generating report', error: error.message });
  }
};

const generateAttendanceReport = async (startDate, endDate, filters) => {
  const query = {
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };

  if (filters?.status) query.status = filters.status;
  if (filters?.student) query.student = filters.student;

  const attendance = await Student.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  return {
    totalRecords: attendance.reduce((sum, item) => sum + item.count, 0),
    summary: attendance
  };
};

const generateFinancialReport = async (startDate, endDate, filters) => {
  const query = {
    createdAt: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };

  if (filters?.status) query.status = filters.status;
  if (filters?.paymentMethod) query.paymentMethod = filters.paymentMethod;

  const payments = await Payment.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalPayments: { $sum: 1 },
        paymentMethods: {
          $push: '$paymentMethod'
        }
      }
    }
  ]);

  return payments[0] || { totalAmount: 0, totalPayments: 0, paymentMethods: [] };
};

const getReportData = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { type, startDate, endDate } = req.query;
    let data;

    switch (type) {
      case 'attendance':
        data = await generateAttendanceReport(startDate, endDate);
        break;
      case 'financial':
        data = await generateFinancialReport(startDate, endDate);
        break;
      case 'student':
        data = await generateStudentReport(startDate, endDate);
        break;
      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching report data:', error);
    res.status(500).json({ message: 'Error fetching report data', error: error.message });
  }
};

const getReportSummary = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { startDate, endDate } = req.query;
    const query = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    const [attendance, financial, student] = await Promise.all([
      generateAttendanceReport(startDate, endDate),
      generateFinancialReport(startDate, endDate),
      generateStudentReport(startDate, endDate)
    ]);

    res.json({
      attendance,
      financial,
      student,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Error fetching report summary:', error);
    res.status(500).json({ message: 'Error fetching report summary', error: error.message });
  }
};

module.exports = {
  generateReport,
  getReportData,
  getReportSummary
}; 