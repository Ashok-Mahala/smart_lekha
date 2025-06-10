const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { config } = require('./config');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/smlekha/auth', require('./routes/auth'));
app.use('/smlekha/users', require('./routes/users'));
app.use('/smlekha/students', require('./routes/students'));
app.use('/smlekha/properties', require('./routes/properties'));
app.use('/smlekha/bookings', require('./routes/bookings'));
app.use('/smlekha/payments', require('./routes/payments'));
app.use('/smlekha/reports', require('./routes/reports'));

// Error handling
app.use(errorHandler);

// Database connection
mongoose.connect(config.mongoURI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Start server
    const PORT = config.port || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

module.exports = app; 