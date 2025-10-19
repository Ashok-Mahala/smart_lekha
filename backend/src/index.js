const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const morgan = require('morgan');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { config: { mongoURI, ...otherConfig } } = require('./config');
const { errorHandler } = require('./middleware/errorHandler');
const { corsMiddleware } = require('./middleware/cors'); // Only import corsMiddleware

// Import routes
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const seatRoutes = require('./routes/seatRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const operationRoutes = require('./routes/operationRoutes');
const systemRoutes = require('./routes/systemRoutes');
const financialRoutes = require('./routes/financialRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const LayoutRoutes = require('./routes/layoutRoutes');
const ShiftRoutes = require('./routes/shiftRoutes');

// Initialize express app
const app = express();

// ==================== CORS CONFIGURATION ====================
// Apply CORS middleware to all routes - this handles preflight automatically
app.use(corsMiddleware);
// ==================== END CORS CONFIGURATION ====================

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));
app.use(helmet());

// Connect to MongoDB
console.log('MongoDB Connection URI:', mongoURI);

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Health check route
app.get('/smlekha/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date(), name: "Smart lekha" });
});

// API Routes
app.use('/smlekha/auth', authRoutes);
app.use('/smlekha/students', studentRoutes);
app.use('/smlekha/seats', seatRoutes);
app.use('/smlekha/bookings', bookingRoutes);
app.use('/smlekha/payments', paymentRoutes);
app.use('/smlekha/reports', reportRoutes);
app.use('/smlekha/operations', operationRoutes);
app.use('/smlekha/system', systemRoutes);
app.use('/smlekha/financial', financialRoutes);
app.use('/smlekha/properties', propertyRoutes);
app.use('/smlekha/layouts', LayoutRoutes);
app.use('/smlekha/shifts', ShiftRoutes);

// Static files with proper CORS headers
app.use('/smlekha/uploads', (req, res, next) => { 
  // Check if origin is in whitelist
  const origin = req.headers.origin;
  if (origin && [
    'http://192.168.1.6:5173',
    'http://localhost:5173',
    'http://localhost:3000'
  ].includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); 
  next(); 
}, express.static(path.join(__dirname, 'uploads')));

// 404 handler for API routes
app.use('/smlekha/*', (req, res, next) => {
  res.status(404).json({
    code: 'not_found',
    message: `Route ${req.originalUrl} not found`,
    status: 404
  });
});

// Global error handler
app.use(errorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = app;