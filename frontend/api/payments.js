// Payments API Service

import { toast } from "sonner";
import PropTypes from 'prop-types';
import api from './axios';

const PAYMENTS_ENDPOINT = '/smlekha/payments';

// Get all payments with optional filtering
export const getPayments = async (params = {}) => {
  try {
    const response = await api.get(PAYMENTS_ENDPOINT, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get payment by ID
export const getPaymentById = async (id) => {
  try {
    const response = await api.get(`${PAYMENTS_ENDPOINT}/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create new payment
export const createPayment = async (paymentData) => {
  try {
    const response = await api.post(PAYMENTS_ENDPOINT, paymentData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update payment
export const updatePayment = async (id, paymentData) => {
  try {
    const response = await api.put(`${PAYMENTS_ENDPOINT}/${id}`, paymentData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete payment
export const deletePayment = async (id) => {
  try {
    const response = await api.delete(`${PAYMENTS_ENDPOINT}/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get payment statistics
export const getPaymentStats = async (params = {}) => {
  try {
    const response = await api.get(`${PAYMENTS_ENDPOINT}/stats`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get payment history for a student
export const getStudentPayments = async (studentId, params = {}) => {
  try {
    const response = await api.get(`${PAYMENTS_ENDPOINT}/student/${studentId}`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get payment history for a seat
export const getSeatPayments = async (seatId, params = {}) => {
  try {
    const response = await api.get(`${PAYMENTS_ENDPOINT}/seat/${seatId}`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Verify payment
export const verifyPayment = async (paymentId) => {
  try {
    const response = await api.post(`${PAYMENTS_ENDPOINT}/${paymentId}/verify`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Refund payment
export const refundPayment = async (paymentId, refundData) => {
  try {
    const response = await api.post(`${PAYMENTS_ENDPOINT}/${paymentId}/refund`, refundData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// PropTypes validation
export const paymentPropTypes = PropTypes.shape({
  id: PropTypes.string.isRequired,
  studentId: PropTypes.string.isRequired,
  studentName: PropTypes.string,
  amount: PropTypes.number.isRequired,
  type: PropTypes.oneOf(["seat-reservation", "fine", "membership", "other"]).isRequired,
  status: PropTypes.oneOf(["completed", "pending", "failed", "refunded"]).isRequired,
  date: PropTypes.string.isRequired,
  reference: PropTypes.string,
  description: PropTypes.string,
});

export const fetchPayments = async () => {
  try {
    const response = await fetch('/smlekha/payments');
    
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('API endpoint not available');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching payments:', error);
    return [];
  }
};

export const fetchDuePayments = async () => {
  try {
    const response = await fetch('/smlekha/payments/due');
    
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('API endpoint not available');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching due payments:', error);
    return [];
  }
};

export const fetchPaymentStats = async () => {
  try {
    const response = await fetch('/smlekha/payments/stats');
    
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('API endpoint not available');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    return {
      total: 0,
      pending: 0,
      completed: 0,
      failed: 0,
      refunded: 0,
    };
  }
};
