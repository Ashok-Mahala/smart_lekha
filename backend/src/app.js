const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const { config } = require('./config');
const { errorHandler } = require('./middleware/errorHandler');
const swaggerSpecs = require('./config/swagger');

// Import routes
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const seatRoutes = require('./routes/seatRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const operationRoutes = require('./routes/operationRoutes');
const financialRoutes = require('./routes/financialRoutes');
const systemRoutes = require('./routes/systemRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const shiftRoutes = require('./routes/shiftRoutes');
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Documentation
app.use('/smlekha-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Routes
app.use('/smlekha/auth', authRoutes);
app.use('/smlekha/students', studentRoutes);
app.use('/smlekha/seats', seatRoutes);
app.use('/smlekha/bookings', bookingRoutes);
app.use('/smlekha/attendance', attendanceRoutes);
app.use('/smlekha/payments', paymentRoutes);
app.use('/smlekha/reports', reportRoutes);
app.use('/smlekha/operations', operationRoutes);
app.use('/smlekha/financial', financialRoutes);
app.use('/smlekha/system', systemRoutes);
app.use('/smlekha/properties', propertyRoutes);
app.use('/smlekha/shifts', shiftRoutes);

// Error handling
app.use(errorHandler);

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

module.exports = app; 