const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const User = require('../models/User');

const createPayment = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const {
      booking,
      amount,
      paymentMethod,
      status,
      notes
    } = req.body;

    const payment = new Payment({
      booking,
      amount,
      paymentMethod,
      status: status || 'pending',
      notes,
      processedBy: req.user._id
    });

    await payment.save();

    res.status(201).json({
      message: 'Payment created successfully',
      payment: await payment.populate(['booking', 'processedBy'])
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ message: 'Error creating payment', error: error.message });
  }
};

const getAllPayments = async (req, res) => {
  try {
    const { status, paymentMethod, startDate, endDate } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const payments = await Payment.find(filter)
      .populate(['booking', 'processedBy'])
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Error fetching payments', error: error.message });
  }
};

const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate(['booking', 'processedBy']);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ message: 'Error fetching payment', error: error.message });
  }
};

const updatePayment = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const {
      amount,
      paymentMethod,
      status,
      notes
    } = req.body;

    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (amount) payment.amount = amount;
    if (paymentMethod) payment.paymentMethod = paymentMethod;
    if (status) payment.status = status;
    if (notes) payment.notes = notes;

    payment.updatedAt = new Date();
    payment.updatedBy = req.user._id;
    await payment.save();

    res.json({
      message: 'Payment updated successfully',
      payment: await payment.populate(['booking', 'processedBy'])
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ message: 'Error updating payment', error: error.message });
  }
};

const deletePayment = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    await payment.deleteOne();

    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ message: 'Error deleting payment', error: error.message });
  }
};

const getPaymentsByUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userId = req.user._id;
    const { status } = req.query;
    
    const filter = { processedBy: userId };
    if (status) filter.status = status;

    const payments = await Payment.find(filter)
      .populate(['booking', 'processedBy'])
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    console.error('Error fetching user payments:', error);
    res.status(500).json({ message: 'Error fetching user payments', error: error.message });
  }
};

const getPaymentsSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const summary = await Payment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          paymentMethods: {
            $push: '$paymentMethod'
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalPayments: 1,
          totalAmount: 1,
          paymentMethods: 1
        }
      }
    ]);

    res.json(summary[0] || { totalPayments: 0, totalAmount: 0, paymentMethods: [] });
  } catch (error) {
    console.error('Error fetching payments summary:', error);
    res.status(500).json({ message: 'Error fetching payments summary', error: error.message });
  }
};

module.exports = {
  createPayment,
  getAllPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
  getPaymentsByUser,
  getPaymentsSummary
}; 