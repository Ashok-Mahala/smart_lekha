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

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/seats', seatRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/operations', operationRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/system', systemRoutes);

// Error handling
app.use(errorHandler);

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

module.exports = app; 