import axios from './axios';
import { API_CONFIG } from './config';
import { toast } from 'sonner';
import PropTypes from 'prop-types';

const API_BASE_URL = `${API_CONFIG.baseURL}/payments`;

export const paymentPropTypes = PropTypes.shape({
  _id: PropTypes.string.isRequired,
  student: PropTypes.string.isRequired,
  seat: PropTypes.string.isRequired,
  shift: PropTypes.string.isRequired,
  assignment: PropTypes.string.isRequired,
  amount: PropTypes.number.isRequired,
  status: PropTypes.oneOf(['pending', 'completed', 'failed', 'refunded']).isRequired,
  paymentMethod: PropTypes.oneOf(['cash', 'card', 'online', 'bank_transfer']).isRequired,
  transactionId: PropTypes.string,
  paymentDate: PropTypes.string,
  dueDate: PropTypes.string,
  period: PropTypes.shape({
    start: PropTypes.string.isRequired,
    end: PropTypes.string.isRequired
  }),
  createdBy: PropTypes.string,
  notes: PropTypes.string
});

export const getPayments = async (params = {}) => {
  try {
    const response = await axios.get(API_BASE_URL, { params });
    return response.data;
  } catch (error) {
    toast.error('Failed to fetch payments');
    throw error;
  }
};

export const getPaymentById = async (paymentId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${paymentId}`);
    return response.data;
  } catch (error) {
    toast.error('Failed to fetch payment');
    throw error;
  }
};

export const createPayment = async (paymentData) => {
  try {
    const response = await axios.post(API_BASE_URL, paymentData);
    toast.success('Payment created successfully');
    return response.data;
  } catch (error) {
    toast.error('Failed to create payment');
    throw error;
  }
};

export const updatePayment = async (paymentId, paymentData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/${paymentId}`, paymentData);
    toast.success('Payment updated successfully');
    return response.data;
  } catch (error) {
    toast.error('Failed to update payment');
    throw error;
  }
};

export const completePayment = async (paymentId, transactionData = {}) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/${paymentId}/complete`, transactionData);
    toast.success('Payment completed successfully');
    return response.data;
  } catch (error) {
    toast.error('Failed to complete payment');
    throw error;
  }
};

export const getPaymentStats = async (params = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/stats/payment-stats`, { params });
    return response.data;
  } catch (error) {
    toast.error('Failed to fetch payment statistics');
    throw error;
  }
};

export const getStudentPayments = async (studentId, params = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/student/${studentId}`, { params });
    return response.data;
  } catch (error) {
    toast.error('Failed to fetch student payments');
    throw error;
  }
};

export const getOverduePayments = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/overdue`);
    return response.data;
  } catch (error) {
    toast.error('Failed to fetch overdue payments');
    throw error;
  }
};

export default {
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  completePayment,
  getPaymentStats,
  getStudentPayments,
  getOverduePayments
};