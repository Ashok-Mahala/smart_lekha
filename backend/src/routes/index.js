const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const studentRoutes = require('./studentRoutes');
const seatRoutes = require('./seatRoutes');
const bookingRoutes = require('./bookingRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const paymentRoutes = require('./paymentRoutes');
const reportRoutes = require('./reportRoutes');
const operationRoutes = require('./operationRoutes');
const systemRoutes = require('./systemRoutes');
const financialRoutes = require('./financialRoutes');
const propertyRoutes = require('./propertyRoutes');

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
router.use('/properties', propertyRoutes);

// Add more route modules here as needed
// router.use('/users', userRoutes);
// router.use('/products', productRoutes);
// etc.

module.exports = router; 