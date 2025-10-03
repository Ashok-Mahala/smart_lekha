const { generateStudentReport, generateBookingReport, generatePaymentReport } = require('../utils/reportGenerator');
const Student = require('../models/Student');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Report = require('../models/Report');

const generateReport = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const {
      type,
      title,
      description,
      parameters,
      format = 'pdf'
    } = req.body;

    // Create report with pending status
    const report = new Report({
      type,
      title,
      description,
      parameters,
      format,
      status: 'processing',
      generatedBy: req.user._id
    });

    await report.save();

    try {
      // Generate report data based on type
      let reportData;
      switch (type) {
        case 'attendance':
          reportData = await generateAttendanceReport(parameters.startDate, parameters.endDate, parameters.filters);
          break;
        case 'financial':
          reportData = await generateFinancialReport(parameters.startDate, parameters.endDate, parameters.filters);
          break;
        case 'student':
          reportData = await generateStudentReport(parameters.startDate, parameters.endDate, parameters.filters);
          break;
        case 'occupancy':
          reportData = await generateOccupancyReport(parameters.startDate, parameters.endDate, parameters.filters);
          break;
        case 'booking':
          reportData = await generateBookingReport(parameters.startDate, parameters.endDate, parameters.filters);
          break;
        case 'payment':
          reportData = await generatePaymentReport(parameters.startDate, parameters.endDate, parameters.filters);
          break;
        default:
          throw new Error('Invalid report type');
      }

      // Update report with data and metadata
      const metadata = {
        rowCount: Array.isArray(reportData) ? reportData.length : 0,
        generationTime: Date.now() - report.createdAt,
        fileSize: 0 // Will be updated when file is generated
      };

      await report.setData(reportData, metadata);

      // Generate file if needed
      if (format !== 'json') {
        const fileBuffer = await generateReportFile(report);
        const fileUrl = await uploadReportFile(fileBuffer, report._id, format);
        report.fileUrl = fileUrl;
        report.metadata.fileSize = fileBuffer.length;
        await report.save();
      }

      res.json({
        message: 'Report generated successfully',
        report
      });
    } catch (error) {
      await report.updateStatus('failed', error.message);
      throw error;
    }
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

const getDailySummary = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalStudents, bookings, payments] = await Promise.all([
      Student.countDocuments({ status: 'active' }),
      Booking.find({ 
        startTime: { $gte: today },
        status: 'active'
      }),
      Payment.find({
        createdAt: { $gte: today },
        status: 'completed'
      })
    ]);

    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const occupancyRate = bookings.length > 0 ? (bookings.length / 100) * 100 : 0; // Assuming 100 is max capacity

    res.json({
      totalStudents,
      peakHour: calculatePeakHour(bookings),
      totalRevenue,
      occupancyRate
    });
  } catch (error) {
    console.error('Error fetching daily summary:', error);
    res.status(500).json({ message: 'Error fetching daily summary', error: error.message });
  }
};

const getOccupancyData = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {
      startTime: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    const bookings = await Booking.find(query);
    const occupancyData = processOccupancyData(bookings);

    res.json(occupancyData);
  } catch (error) {
    console.error('Error fetching occupancy data:', error);
    res.status(500).json({ message: 'Error fetching occupancy data', error: error.message });
  }
};

const getRevenueData = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    console.log('🔍 Revenue query parameters:', { startDate, endDate });

    // Safe date parsing function
    const safeDateParse = (dateString, defaultValue = null) => {
      if (!dateString) return defaultValue;
      
      // Handle common date formats
      let date = new Date(dateString);
      
      // If basic parsing fails, try ISO format without time
      if (isNaN(date.getTime())) {
        date = new Date(dateString + 'T00:00:00.000Z');
      }
      
      // If still invalid, try parsing as timestamp
      if (isNaN(date.getTime())) {
        const timestamp = parseInt(dateString);
        if (!isNaN(timestamp)) {
          date = new Date(timestamp);
        }
      }
      
      return isNaN(date.getTime()) ? defaultValue : date;
    };

    // Calculate default dates (last 30 days)
    const defaultEnd = new Date();
    const defaultStart = new Date();
    defaultStart.setDate(defaultStart.getDate() - 30);
    defaultStart.setHours(0, 0, 0, 0);
    defaultEnd.setHours(23, 59, 59, 999);

    // Parse dates with fallbacks
    const start = safeDateParse(startDate, defaultStart);
    const end = safeDateParse(endDate, defaultEnd);

    // Validate date range
    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be after end date'
      });
    }

    console.log('📅 Using date range:', {
      start: start.toISOString(),
      end: end.toISOString()
    });

    const query = {
      createdAt: { $gte: start, $lte: end },
      status: 'completed'
    };

    const payments = await Payment.find(query);
    console.log(`💰 Found ${payments.length} completed payments`);

    const revenueData = processRevenueData(payments);

    res.json({
      success: true,
      data: revenueData,
      meta: {
        period: { start, end },
        totalPayments: payments.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching revenue data:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching revenue data', 
      error: error.message,
      suggestion: 'Please ensure date parameters are in valid format (YYYY-MM-DD, ISO, or timestamp)'
    });
  }
};

const getStudentActivityData = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    const [bookings, payments] = await Promise.all([
      Booking.find(query).populate('studentId'),
      Payment.find(query).populate('studentId')
    ]);

    const activityData = processStudentActivityData(bookings, payments);
    res.json(activityData);
  } catch (error) {
    console.error('Error fetching student activity data:', error);
    res.status(500).json({ message: 'Error fetching student activity data', error: error.message });
  }
};

const getFinancialData = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    const payments = await Payment.find(query);
    const financialData = processFinancialData(payments);

    res.json(financialData);
  } catch (error) {
    console.error('Error fetching financial data:', error);
    res.status(500).json({ message: 'Error fetching financial data', error: error.message });
  }
};

const getAllReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    const reports = await Report.find(query)
      .populate('generatedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Error fetching reports', error: error.message });
  }
};

const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('generatedBy', 'name email');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ message: 'Error fetching report', error: error.message });
  }
};

const createReport = async (req, res) => {
  try {
    const { type, title, description, parameters, format } = req.body;

    const report = new Report({
      type,
      title,
      description,
      parameters,
      format,
      status: 'pending',
      generatedBy: req.user._id
    });

    await report.save();
    res.status(201).json(report);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ message: 'Error creating report', error: error.message });
  }
};

const deleteReport = async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ message: 'Error deleting report', error: error.message });
  }
};

const downloadReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (report.status !== 'completed') {
      return res.status(400).json({ message: 'Report is not ready for download' });
    }

    if (report.fileUrl) {
      // If file is already generated, redirect to file URL
      return res.redirect(report.fileUrl);
    }

    // Generate file on the fly
    const fileBuffer = await generateReportFile(report);
    
    // Set appropriate headers based on format
    const contentType = {
      'pdf': 'application/pdf',
      'excel': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'csv': 'text/csv',
      'json': 'application/json'
    }[report.format];

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${report.title || 'report'}.${report.format}`);
    res.send(fileBuffer);
  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({ message: 'Error downloading report', error: error.message });
  }
};

const calculatePeakHour = (bookings) => {
  // Implementation to calculate peak hour from bookings
  return "14:00"; // Placeholder
};

const processOccupancyData = (bookings) => {
  // Implementation to process occupancy data
  return {
    daily: [{ current: 0, total: 100 }],
    weekly: [{ current: 0, total: 100 }],
    monthly: [{ current: 0, total: 100 }],
    yearly: [{ current: 0, total: 100 }]
  };
};

const processRevenueData = (payments) => {
  // Implementation to process revenue data
  return {
    daily: [{ amount: 0 }],
    weekly: [{ amount: 0 }],
    monthly: [{ amount: 0 }],
    yearly: [{ amount: 0 }]
  };
};

const processStudentActivityData = (bookings, payments) => {
  // Implementation to process student activity data
  return [];
};

const processFinancialData = (payments) => {
  // Implementation to process financial data
  return [];
};

const generateReportFile = async (report) => {
  // Implementation to generate report file
  return Buffer.from(''); // Placeholder
};

module.exports = {
  generateReport,
  getReportData,
  getReportSummary,
  getDailySummary,
  getOccupancyData,
  getRevenueData,
  getStudentActivityData,
  getFinancialData,
  getAllReports,
  getReportById,
  createReport,
  deleteReport,
  downloadReport
}; 