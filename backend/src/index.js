const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const { config: { mongoURI, ...otherConfig } } = require('./config');
// Then use mongoURI directly
const { errorHandler } = require('./middleware/errorHandler');

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
// Initialize express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));
app.use(helmet());

// Connect to MongoDB

// Add this right before your mongoose.connect()
//console.log('Attempting to connect to MongoDB with URI:', config.mongoURI);
//console.log('Full config object:', config);
console.log('Environment variables:', {
  MONGODB_URI: process.env.MONGODB_URI,
  MONGODB_USERNAME: process.env.MONGODB_USERNAME,
  MONGODB_PASSWORD: process.env.MONGODB_PASSWORD,
  MONGODB_HOST: process.env.MONGODB_HOST,
  MONGODB_PORT: process.env.MONGODB_PORT,
  MONGODB_DATABASE: process.env.MONGODB_DATABASE
});
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