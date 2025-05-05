const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const studentRoutes = require('./student.routes');
const seatRoutes = require('./seat.routes');
const bookingRoutes = require('./bookingRoutes');
const attendanceRoutes = require('./attendance.routes');
const paymentRoutes = require('./payment.routes');
const reportRoutes = require('./report.routes');
const operationRoutes = require('./operation.routes');
const systemRoutes = require('./system.routes');
const financialRoutes = require('./financial.routes');

// Health check route
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/seats', seatRoutes);
router.use('/bookings', bookingRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/payments', paymentRoutes);
router.use('/reports', reportRoutes);
router.use('/operations', operationRoutes);
router.use('/system', systemRoutes);
router.use('/financial', financialRoutes);

// Add more route modules here as needed
// router.use('/users', userRoutes);
// router.use('/products', productRoutes);
// etc.

module.exports = router; 